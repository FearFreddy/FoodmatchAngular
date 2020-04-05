import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators'
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

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

    apiKeys: string[] = ["c343924f10834fb9800e858f2858b9ed", "ecf9e428c5214fdea95e82879ae07f76", "f0996c429b304210b287e8fb85dce5d5"]
    currentKey: number = 0
    apiKey: string = this.apiKeys[this.currentKey]

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
                .get<Ingredient[]>(`https://api.spoonacular.com/food/ingredients/autocomplete?query=${term}&number=50&apiKey=${this.apiKey}&metaInformation=true`)
                .pipe(
                    catchError(error => this.handleError(error))
                );
            return result;
        } else {
            return of([]);
        }
    }

    /*** RECIPES ****/
    getRecipes(term: string = null, diets: string = null): Observable<Recipe[]> {
        return this.http.get<Recipes>(`https://api.spoonacular.com/recipes/search?query=${term}&diet=${diets}&number=100&apiKey=${this.apiKey}`)
            .pipe(
                map(result => result.results),
                catchError(error => this.handleError(error))
            );
    }

    /*** RECIPE INFORMATION ****/
    getRecipeInformation(id: string = null): Observable<Recipe> {
        return this.http.get<Recipe>(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${this.apiKey}`)
            .pipe(
                catchError(error => this.handleError(error))
            );
    }


    getRecipesByIngredient(ingredients: Ingredient[]): Observable<RecipeByIngredients[]> {
        if (ingredients !== null) {
            let ingredientsString = "";
            ingredients.forEach(ingredient => {
                ingredientsString = ingredientsString.concat(ingredient.name + ",");
            });
            return this.http
                .get<RecipeByIngredients[]>(`https://api.spoonacular.com/recipes/findByIngredients?number=100&ranking=2&ingredients=${ingredientsString}&apiKey=${this.apiKey}`)
                .pipe(
                    catchError(error => this.handleError(error))
                );
        } else {
            return of([]);
        }
    }

    handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            if (this.currentKey < 2) {
                this.currentKey++;
                this.apiKey = this.apiKeys[this.currentKey];
            } else {
                this.currentKey = 0;
                this.apiKey = this.apiKeys[this.currentKey];
            }
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.error}`);
            alert("API Key limit is used for today. Trying different one on your next action")
        }
        // return an observable with a user-facing error message
        return throwError(
            'Something bad happened; please try again later.');
    };
}