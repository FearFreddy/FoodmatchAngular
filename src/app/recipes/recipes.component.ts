import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService, Recipe, RecipeByIngredients, Ingredient, User } from "../data.service";
import { faTimes, faStar, faChevronDown, faChevronUp, faCheck } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { from, Subscription } from 'rxjs';
import { map, concatMap, tap, finalize } from 'rxjs/operators'


@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent implements OnInit {
  faTimes = faTimes;
  faStar = faStar;
  faStarRegular = faStarRegular;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faCheck = faCheck;

  recipes: Recipe[];
  recipesByIngredient: RecipeByIngredients[];
  clickedRecipe = ""; // is either Recipe or RecipeByIngredient
  showInstructions = false;
  loadingSpinner = false;

  filters = [
    { text: 'based on your stock', status: false },
    { text: 'vegan', status: false },
    { text: 'vegetarian', status: false },
    { text: 'gluten free', status: false },
    { text: 'dairy free', status: false },
    { text: 'show only favorites', status: false },
  ]
  searchTerm = "";
  user: User;
  subscription: Subscription

  constructor(private dataService: DataService, private modalService: NgbModal) { }

  ngOnInit() {
    this.loadRecipes();
    this.subscription = this.dataService.getUser().subscribe(
      user => {
        if (user) {
          if (!this.user && user.savedIngredients.length != 0) {
            this.filters[0].status = true;
          }
          this.user = user;
          this.loadRecipes();
        } else {
          // disable "based on your stock"
          this.filters[0].status = false;
        }
      });
  }

  toggleInstructions() {
    this.showInstructions = !this.showInstructions;
  }

  openLg(content) {
    this.modalService.open(content, { size: 'lg' });
  }

  selectRecipe($event) {
    this.clickedRecipe = $event;
    this.showInstructions = false;
  }

  shoppingListContainsAll(ingredients) {
    return ingredients.every(ingredient => this.user.neededIngredients.includes(ingredient.id));
  }

  addToShoppingList($ingredients: Ingredient[]) {
    this.loadingSpinner = true;
    from($ingredients)
      .pipe(
        concatMap(ingredient => this.dataService.saveIngredient(this.user.id, true, ingredient.id)),
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

  loadRecipes() {
    if (this.filters[0].status) {
      this.dataService.getIngredientsOfUser(this.user.id, false).subscribe(savedIngredients => {
        this.dataService.getRecipesByIngredient(savedIngredients).subscribe(recipes => {
          this.recipesByIngredient = recipes
            .filter(recipe => this.filters[1].status ? recipe.recipe.vegan : true)
            .filter(recipe => this.filters[2].status ? recipe.recipe.vegetarian : true)
            .filter(recipe => this.filters[3].status ? recipe.recipe.glutenFree : true)
            .filter(recipe => this.filters[4].status ? recipe.recipe.dairyFree : true)
            .filter(recipe => this.filters[5].status ? this.user.favoriteRecipe.includes(recipe.recipe.id) : true)
            .filter(recipe => this.searchTerm ? recipe.recipe.title.toLowerCase().includes(this.searchTerm.toLowerCase()) : true)
            .sort((a, b) => a.missingIngredient.length - b.missingIngredient.length)
        });
      });
    } else {
      this.dataService.getRecipes(this.searchTerm).subscribe((recipes) => {
        this.recipes = recipes
          .filter(recipe => this.filters[1].status ? recipe.vegan : true)
          .filter(recipe => this.filters[2].status ? recipe.vegetarian : true)
          .filter(recipe => this.filters[3].status ? recipe.glutenFree : true)
          .filter(recipe => this.filters[4].status ? recipe.dairyFree : true)
          .filter(recipe => this.filters[5].status ? this.user.favoriteRecipe.includes(recipe.id) : true)
      });
    }
  }
}

