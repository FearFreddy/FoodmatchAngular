import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService, Recipe, RecipeByIngredients, Ingredient, User } from "../data.service";
import { faTimes, faStar, faChevronDown, faChevronUp, faCheck } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { from, Subscription, Subject, Observable } from 'rxjs';
import { concatMap, finalize, distinctUntilChanged, switchMap, debounceTime, flatMap, map, tap } from 'rxjs/operators'


@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit {
  faTimes = faTimes;
  faStar = faStar;
  faStarRegular = faStarRegular;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faCheck = faCheck;

  recipes$: Observable<Recipe[] | RecipeByIngredients[]>;
  clickedRecipe: Recipe | RecipeByIngredients; // is either Recipe or RecipeByIngredient
  recipesLoading: boolean = false;
  showInstructions = false;
  loadingSpinner = false;

  recipeDetailLoaded = false;

  filters = [
    { text: 'based on your stock', status: false, disableForIngredientSearch: false },
    { text: 'show only favorites', status: false, disableForIngredientSearch: false },
    { text: 'vegan', status: false, disableForIngredientSearch: true },
    { text: 'vegetarian', status: false, disableForIngredientSearch: true },
  ]
  searchTerm$ = new Subject<string>();
  currentTerm: string = "";
  user: User;
  subscription: Subscription

  modalRef: any;

  constructor(private dataService: DataService, private modalService: NgbModal) { }

  ngOnInit() {
    this.loadRecipes();
    this.subscription = this.dataService.getUser().subscribe(
      user => {
        if (user) {
          if (!this.user && user.availableSavedIngredients.length != 0) {
            this.filters[0].status = true;
          }
          this.user = user;
          this.loadRecipes();
        } else {
          // disable "based on your stock"
          this.filters[0].status = false;
        }
      });
    this.searchTerm$.subscribe(term => {
      this.currentTerm = term;
    })
    this.resetSearch();
  }

  resetSearch() {
    const backup = this.currentTerm;
    this.searchTerm$.next(backup + "a");
    setTimeout(() => {
      this.searchTerm$.next(backup);
    }, 601)
  }

  toggleInstructions() {
    this.showInstructions = !this.showInstructions;
  }

  closeModal() {
    this.modalRef.close();
  }

  openLg(content) {
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true });
    this.modalRef.result.then(value => {
      console.log(value); // Success!
      this.recipeDetailLoaded = false;
    }, reason => {
      console.log(reason); // Error!
      this.recipeDetailLoaded = false;
    });
  }

  selectRecipe($event) {
    this.dataService.getRecipeInformation($event.id).subscribe(recipe => {
      this.clickedRecipe = { ...recipe, ...$event };
      this.recipeDetailLoaded = true;
    });
    this.showInstructions = false;
  }

  shoppingListContainsAll(ingredients) {
    const userIngredients = this.user.neededSavedIngredients.map(ingr => ingr.id);
    return ingredients.every(ingredient => userIngredients.includes(ingredient.id));
  }

  addToShoppingList($ingredients: Ingredient[]) {
    this.loadingSpinner = true;
    from($ingredients)
      .pipe(
        concatMap(ingredient => this.dataService.saveIngredient(this.user.id, true, ingredient)),
        finalize(() => {
          this.dataService.setUserByName("Miro");
          this.loadingSpinner = false;
        })
      )
      .subscribe();
  }

  addFavorite(recipeId: number) {
    this.dataService.saveRecipe(this.user.id, recipeId).subscribe(() => {
      this.dataService.setUserByName("Miro");
    });
  }

  removeFavorite(recipeId: number) {
    this.dataService.removeRecipe(this.user.id, recipeId).subscribe(() => {
      this.dataService.setUserByName("Miro");
    });
  }

  search(term: string) {
    this.searchTerm$.next(term);
  }

  loadRecipes() {
    this.recipes$ = this.searchTerm$.pipe(
      tap(() => (this.recipesLoading = true)),
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(term => {
        if (this.filters[0].status) {
          return this.dataService.getIngredientsOfUser(this.user.id, false).pipe(
            flatMap(savedIngredients =>
              this.dataService.getRecipesByIngredient(savedIngredients).pipe(
                map(recipes =>
                  recipes
                    .filter(recipe => this.filters[1].status ? this.user.favoriteRecipe.includes(recipe.id) : true)
                    .filter(recipe => term ? recipe.title.toLowerCase().includes(term.toLowerCase()) : true)
                    .sort((a, b) => a.missedIngredients.length - b.missedIngredients.length)
                ),
                tap(() => (this.recipesLoading = false))
              )
            )
          )
        } else {
          let diets = "";
          if (this.filters[2].status) {
            diets = diets.concat("vegan,");
          }
          if (this.filters[3].status) {
            diets = diets.concat("vegetarian");
          }
          return this.dataService.getRecipes(term, diets).pipe(
            map(recipes => recipes
              .filter(recipe => this.filters[1].status ? this.user.favoriteRecipe.includes(recipe.id) : true)),
            tap(() => (this.recipesLoading = false))
          )
        }
      })
    );
  }
}

