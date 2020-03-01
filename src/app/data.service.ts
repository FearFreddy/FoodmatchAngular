import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http';

export interface User {
    male: boolean;
    savedIngredients: number[];
    neededIngredients: number[];
    favoriteRecipe: number[];
    id: number;
    firstname: string;
    surname: string;
}

export interface Ingredient {
    id: number;
    name: string;
    aisle: string;
}
export interface Recipe {
    id: number;
    title: string;
    image: string;
    servings: number;
    readyInMinutes: number;
    instructions: string;
    vegan: boolean;
    vegetarian: boolean;
    glutenFree: boolean;
    veryHealthy: boolean;
    dairyFree: boolean;
    ingredients: Ingredient[];
}
export interface Recipes {
    results: Recipe[];
}

export interface RecipeByIngredients {
    recipe: Recipe;
    missingIngredient: Ingredient[];
    availableIngredient: Ingredient[];
}

@Injectable({
    providedIn: 'root'
})
export class DataService {

    hostname: string = "https://morning-harbor-68780.herokuapp.com"
    spoonacular: string = "https://api.spoonacular.com/food/ingredients/autocomplete?query=${term}&number=50&apiKey=ecf9e428c5214fdea95e82879ae07f76"

    currentUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);

    setUser(user: User) {
        this.currentUser.next(user);
    }

    getUser(): Observable<User> {
        return this.currentUser.asObservable();
    }

    constructor(private http: HttpClient) {
        this.setUserByName("Miro");
    }

    /*** USER ****/
    getUsersByName(name: string) {
        return this.http
            .get<User[]>(this.hostname + `user/search?search=` + name);
    }

    setUserByName(name: string) {
        this.getUsersByName(name).subscribe(users => {
            this.setUser(users[0]);
        });
    }

    getIngredientsOfUser(userId: number = null, isShoppingList: boolean = false): Observable<Ingredient[]> {
        return this.http.get<Ingredient[]>(this.hostname + `user/ingredients?userId=` + userId + `&isShoppingList=` + isShoppingList);
    }

    saveIngredient(userId: number, isShoppingList: boolean, ingredientId: number) {
        return this.http
            .get(this.hostname + `user/addIngredient?userId=` + userId + `&isShoppingList=` + isShoppingList + `&ingredientId=` + ingredientId)
    }

    removeIngredient(userId: number, isShoppingList: boolean, ingredientId: number) {
        return this.http
            .get(this.hostname + `user/removeIngredient?userId=` + userId + `&isShoppingList=` + isShoppingList + `&ingredientId=` + ingredientId)
    }

    saveRecipe(userId: number, recipeId: number) {
        return this.http
            .get(this.hostname + `user/addRecipe?userId=` + userId + `&recipeId=` + recipeId)
    }

    removeRecipe(userId: number, recipeId: number) {
        return this.http
            .get(this.hostname + `user/removeRecipe?userId=` + userId + `&recipeId=` + recipeId)
    }

    /*** INGREDIENTS ****/
    getIngredients(term: string = null): Observable<Ingredient[]> {
        if (term !== null) {
            return this.http
                .get<Ingredient[]>(this.hostname + `ingredients/search?search=` + term);
        } else {
            return of([]);
        }
    }

    /*** RECIPES ****/
    getRecipes(term: string = null): Observable<Recipe[]> {
        if (term !== null && term !== "") {
            return this.http
                .get<Recipe[]>(this.hostname + `recipes/search?search=` + term);
        } else {
            return this.http
                .get<Recipe[]>(this.hostname + `recipes`);
        }
    }

    getRecipesByIngredient(ingredients: Ingredient[]): Observable<RecipeByIngredients[]> {
        if (ingredients !== null) {
            let ingredientsString = "";
            ingredients.forEach(ingredient => {
                ingredientsString = ingredientsString.concat(ingredient.name + ",");
            });
            return this.http
                .get<RecipeByIngredients[]>(this.hostname + `recipes/findByIngredients?ingredients=${ingredientsString}`);
        } else {
            return of([]);
        }
    }
}