
import { Component, OnInit } from "@angular/core";
import { concat, Observable, of, Subject, Subscription } from "rxjs";
import {
  catchError,
  distinctUntilChanged,
  switchMap,
  tap
} from "rxjs/operators";
import { DataService, Ingredient, User } from "../data.service";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit {
  faTimes = faTimes;

  ingredients$: Observable<Ingredient[]>;
  ingredientsLoading = false;
  ingredientInput$ = new Subject<string>();
  shoppingList: Object = {};

  user: User;
  subscription: Subscription

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.loadIngredients();
    this.subscription = this.dataService.getUser().subscribe(
      user => {
        if (user) {
          this.user = user;
          this.loadAndSortShoppingList();
        }
      });
  }

  addItem($selectedIngredient) {
    if ($selectedIngredient) {
      this.dataService.saveIngredient(this.user.id, true, $selectedIngredient)
        .pipe(tap(() => this.dataService.setUserByName("Miro")))
        .subscribe(() => this.loadAndSortShoppingList());
    }
  }

  deleteItem($selectedIngredient) {
    this.dataService.removeIngredient(this.user.id, true, $selectedIngredient.id).subscribe(() => {
      setTimeout(() => {
        this.shoppingList[$selectedIngredient.aisle] = this.shoppingList[$selectedIngredient.aisle].filter(ing => ($selectedIngredient.id !== ing.id));
        if (this.shoppingList[$selectedIngredient.aisle].length == 0) {
          delete this.shoppingList[$selectedIngredient.aisle];
        }
        this.dataService.setUserByName("Miro");
      }, 500)
    });
  }

  boughtItem($selectedIngredient) {
    this.dataService.saveIngredient(this.user.id, false, $selectedIngredient).subscribe(() => this.deleteItem($selectedIngredient));
  }

  /**
   * Loads the saved ingredients of the user, sorts them by the aisles and stores it in this.shoppingList
   */
  private loadAndSortShoppingList() {
    this.dataService.getIngredientsOfUser(this.user.id, true).subscribe(savedIngredients => {
      savedIngredients.forEach(savedIngredient => {
        // check if aisle of selected ingredient is already inside the this.shoppingList object
        if (savedIngredient.aisle in this.shoppingList) {
          // check if selected ingredient is already inside that aisle, if not ...
          if (this.shoppingList[savedIngredient.aisle].filter(sortedIngredient => (sortedIngredient.name === savedIngredient.name)).length === 0) {
            // ... add it to the aisle
            this.shoppingList[savedIngredient.aisle].push({ name: savedIngredient.name, id: savedIngredient.id, aisle: savedIngredient.aisle });
          }
        } else {
          // if aisle of selected ingredient is not there yet, create the aisle and add ingredient to it
          this.shoppingList[savedIngredient.aisle] = [({ name: savedIngredient.name, id: savedIngredient.id, aisle: savedIngredient.aisle })];
        }
      });
    });
  }

  trackByFn(item: Ingredient) {
    return item.name;
  }

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