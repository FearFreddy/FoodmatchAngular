import { Component, OnInit } from "@angular/core";
import { concat, Observable, of, Subject, Subscription } from "rxjs";
import { catchError, distinctUntilChanged, switchMap, tap } from "rxjs/operators";
import { DataService, Ingredient, User } from "../data.service";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-ingredients",
  templateUrl: "./ingredients.component.html",
  styleUrls: ["./ingredients.component.scss"]
})
export class IngredientsComponent implements OnInit {
  faTimes = faTimes;

  ingredients$: Observable<Ingredient[]>;
  ingredientsLoading = false;
  ingredientInput$ = new Subject<string>();
  savedIngredientsSorted: Object = {};
  dbError: String = "";
  user: User;
  subscription: Subscription

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.loadIngredients();
    this.subscription = this.dataService.getUser().subscribe(
      user => {
        if (user) {
          this.user = user;
          this.loadAndSortSavedIngredients();
        }
      });
  }

  /**
   * Gets called when user selected an ingredient -> saves it in the db and afterwards calls loadAndSortSavedIngredients
   */
  addItem($selectedIngredient) {
    if ($selectedIngredient) {
      this.dataService.saveIngredient(this.user.id, false, $selectedIngredient)
        .pipe(tap(() => this.dataService.setUserByName("Miro")))
        .subscribe(() => this.loadAndSortSavedIngredients());
    }
  }

  deleteItem($selectedIngredient) {
    this.dataService.removeIngredient(this.user.id, false, $selectedIngredient.id).subscribe(() => {
      this.savedIngredientsSorted[$selectedIngredient.aisle] = this.savedIngredientsSorted[$selectedIngredient.aisle].filter(ing => ($selectedIngredient.id !== ing.id));
      if (this.savedIngredientsSorted[$selectedIngredient.aisle].length == 0) {
        delete this.savedIngredientsSorted[$selectedIngredient.aisle];
      }
      this.dataService.setUserByName("Miro");
    });
  }

  /**
   * Loads the saved ingredients of the user, sorts them by the aisles and stores it in this.savedIngredientsSorted
   */
  private loadAndSortSavedIngredients() {
    this.dataService.getIngredientsOfUser(this.user.id, false).subscribe(savedIngredients => {
      savedIngredients.forEach(savedIngredient => {
        // check if aisle of selected ingredient is already inside the this.savedIngredientsSorted object
        if (savedIngredient.aisle in this.savedIngredientsSorted) {
          // check if selected ingredient is already inside that aisle, if not ...
          if (this.savedIngredientsSorted[savedIngredient.aisle].filter(sortedIngredient => (sortedIngredient.name === savedIngredient.name)).length === 0) {
            // ... add it to the aisle
            this.savedIngredientsSorted[savedIngredient.aisle].push({ name: savedIngredient.name, id: savedIngredient.id, aisle: savedIngredient.aisle });
          }
        } else {
          // if aisle of selected ingredient is not there yet, create the aisle and add ingredient to it
          this.savedIngredientsSorted[savedIngredient.aisle] = [({ name: savedIngredient.name, id: savedIngredient.id, aisle: savedIngredient.aisle })];
        }
      });
    });
  }

  trackByFn(item: Ingredient) {
    return item.name;
  }

  /**
   * Listens to the select box. When the user types, it calls the db and gets the ingredients with the typed term asynchronously
   */
  private loadIngredients() {
    this.ingredients$ = concat(
      of([]), // default items
      this.ingredientInput$.pipe(
        distinctUntilChanged(),
        tap(() => (this.ingredientsLoading = true)),
        switchMap(term =>
          this.dataService.getIngredients(term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => (this.ingredientsLoading = false))
          )
        )
      )
    );
  }
}
