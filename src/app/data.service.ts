import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http';

export interface User {
    male: boolean;
    savedIngredients: number[];
    neededIngredients: number[];
    neededSavedIngredients: Ingredient[];
    availableSavedIngredients: Ingredient[];
    favoriteRecipe: number[];
    id: number;
    firstname: string;
    surname: string;
}

export interface Ingredient {
    id: number;
    name: string;
    aisle: string;
    image: string;
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
    id: number;
    title: string;
    image: string;
    missedIngredients: Ingredient[];
    usedIngredients: Ingredient[];
}

@Injectable({
    providedIn: 'root'
})
export class DataService {

    hostname: string = "https://morning-harbor-68780.herokuapp.com/"
    // hostname: string = "http://localhost:8080/"
    apiKey: string = "c343924f10834fb9800e858f2858b9ed"

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

    getIngredientsOfUser(userId: number = null, isShoppingList: boolean = false): Observable<any> {
        return this.http.get<Ingredient[]>(this.hostname + `user/savedIngredients?userId=` + userId + `&isShoppingList=` + isShoppingList)
    }

    saveIngredient(userId: number, isShoppingList: boolean, ingredient: any) {
        return this.http
            .post(this.hostname + `user/addSavedIngredient?userId=` + userId + `&isShoppingList=` + isShoppingList, ingredient)
    }

    removeIngredient(userId: number, isShoppingList: boolean, ingredientId: number) {
        return this.http
            .get(this.hostname + `user/removeSavedIngredient?userId=` + userId + `&isShoppingList=` + isShoppingList + `&ingredientId=` + ingredientId)

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
            // Against spoonacular API
            let result = this.http
                .get<Ingredient[]>(`https://api.spoonacular.com/food/ingredients/autocomplete?query=${term}&number=50&apiKey=${this.apiKey}&metaInformation=true`);
            return result;
        } else {
            return of([]);
        }
    }

    /*** RECIPES ****/
    getRecipes(term: string = null): Observable<Recipe[]> {
        return this.http.get<Recipes>(`https://api.spoonacular.com/recipes/search?query=${term}&number=20&apiKey=${this.apiKey}`)
            .pipe(map(result => result.results));
    }

    /*** RECIPE INFORMATION ****/
    getRecipeInformation(id: string = null): Observable<Recipe> {
        return this.http.get<Recipe>(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${this.apiKey}`)
    }


    getRecipesByIngredient(ingredients: Ingredient[]): Observable<RecipeByIngredients[]> {
        if (ingredients !== null) {
            let ingredientsString = "";
            ingredients.forEach(ingredient => {
                ingredientsString = ingredientsString.concat(ingredient.name + ",");
            });
            return this.http
                .get<RecipeByIngredients[]>(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsString}&apiKey=${this.apiKey}`);
        } else {
            return of([]);
        }
    }
}