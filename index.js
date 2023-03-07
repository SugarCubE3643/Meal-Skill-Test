// Creating the app as an object with the constants and functions being the key value pairs
const mealApp = {
  // base url for themealsdb api
  baseURL: "https://www.themealdb.com/api/json/v1/1/",

  // Time after which suggestions are fetched after typing in search box
  // If the time gap between typed characters if smaller than delay the fetch request is not sent
  suggestionDelay: 1000,

  // Init function which will check which page is being randered currently and calls appropriate functions and adds event listeners using switch case
  init: () => {
    // checking is favourites is stored in localstorage or not if not stored creates an empty array for favourites in localstorage
    if (localStorage.getItem("favourites") === null) {
      const initFav = [];
      localStorage.setItem("favourites", JSON.stringify(initFav));
    }

    // Getting the current page using id set on body tag of each page
    const currentPage = document.body.id;
    switch (currentPage) {
      case "home":
        // Adding an event listener to the search box listening for changes in input
        // It calls for getMealsSuggestions through debounce function
        document
          .querySelector("#search-box")
          .addEventListener(
            "input",
            mealApp.debounce(
              mealApp.getMealSuggestions,
              mealApp.suggestionDelay
            )
          );
        break;
      case "details":
        // Getting the URL parameter id
        var query = window.location.search;
        const urlParams = new URLSearchParams(query);
        const id = urlParams.get("id");

        // Checking if the id parameter is present or not
        if (id) {
          mealApp.getMealDetails(id);
        } else {
          // Adding an error message to the content in case no id present
          document.querySelector("main").innerHTML = `
            <h1 style="
                color:var(--link-font-color);
                font-size:4rem;
              ">
              Invalid Link
            </h1>`;
        }
        break;
      case "favourites":
        mealApp.getFavourites();
    }
  },

  // Debounce function
  debounce: function (fn, delay) {
    let timer;
    return function () {
      let context = this,
        args = arguments;
      // If the function is called again before the setTimeout delay is over the timer is cleared before it can use the callback function
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(context, args);
      }, delay);
    };
  },

  // API which takes in a URL and returns either resolved promise with the requested data or rejected promise with error message
  mealAPI: async (mealURL) => {
    const response = await fetch(mealURL);

    // If response.ok is true it means the request succeded
    // If it is false it means the request failed
    if (response.ok) {
      const responseJSON = await response.json();
      return Promise.resolve(responseJSON);
    } else {
      // returning rejected promise with a collective message that represents all types of failed request
      return Promise.reject("Server error");
    }
  },

  //
  toggleMealInFavourites: (e) => {
    // Getting list of favourites
    let favourites = JSON.parse(localStorage.getItem("favourites"));

    // Getting index of the meal in favourites array using data attribute id of target
    const index = favourites.indexOf(e.target.dataset.id);

    // indexOf returns -1 when the element is not present
    // Adding the item to favourites list in this case
    // and removing it from the favourites list otherwise
    if (index == -1) {
      favourites = [...favourites, e.target.dataset.id];
    } else {
      favourites.splice(index, 1);
    }

    // Putting the new favourites list back into the localstorage
    localStorage.setItem("favourites", JSON.stringify(favourites));

    // Setting the after checking if the id is present in favourites list
    e.target.setAttribute(
      "data-favourite",
      favourites.includes(e.target.dataset.id)
    );

    // Performing separate actions based on which page the toggle function is being called from
    const currentPage = document.body.id;
    if (currentPage === "favourites") {
      // Removing the favourite item from DOM
      e.target.parentElement.remove();
    }
  },
  ///////////////////// Functions for home page /////////////////////

  // Function for fetching suggestions
  getMealSuggestions: (e) => {
    let partialInput = e.target.value;
    let mealURL = mealApp.baseURL + "search.php?s=" + partialInput;

    // Fetching the meals using partial input
    mealApp
      .mealAPI(mealURL)
      .then((data) => {
        // Setting data.meals as empty array in case input is empty
        if (partialInput === "") data.meals = [];

        // Adding  meals to suggestions list using meals array
        if (data) mealApp.addMealsToSuggestions(data.meals);
      })
      .catch((message) => {
        // Adding an error message to the suggestions in case API returns rejected promise
        const listItem = document.createElement("li");
        listItem.classList.add("search-result", "flex");
        listItem.innerHTML = `<span>${message}</span>`;
        searchSuggestions.append(listItem);
      });
  },

  // Takes in a meals array as input and adds all the details to suggestions in DOM
  addMealsToSuggestions: (meals) => {
    let searchSuggestions = document.querySelector("#search-results");

    // Emptying out the previous suggestions
    searchSuggestions.innerHTML = "";

    // Getting favourite meals from localstorage
    let favourites = JSON.parse(localStorage.getItem("favourites"));
    if (meals) {
      meals.forEach((meal) => {
        // Checking if the meal is present in favourites or not
        const favourite = favourites.includes(meal.idMeal);

        // Creating list item using another function with meal information
        const listItem = mealApp.createListItemSuggestions(meal, favourite);

        // Adding the meal suggestion to DOM
        searchSuggestions.appendChild(listItem);
      });
    } else {
      // If meals is null that means no meals were found in database
      // Adding No meals found message to suggestions in this case
      const listItem = document.createElement("li");
      listItem.classList.add("search-result", "flex");
      listItem.innerHTML = `<span>No meals found</span>`;
      searchSuggestions.append(listItem);
    }
  },

  // Creating list item using meal information
  createListItemSuggestions: (meal, favourite) => {
    const listItem = document.createElement("li");
    listItem.classList.add("search-result", "flex");
    listItem.innerHTML = `
            <a href="details.html?id=${meal.idMeal}" class="flex">
              <img
                src="${meal.strMealThumb}"
                alt="thumbnail"
              />
              <span>${meal.strMeal}</span>
            </a>
        `;
    const favIcon = document.createElement("button");
    favIcon.setAttribute("data-favourite", favourite);
    favIcon.setAttribute("data-id", meal.idMeal);
    favIcon.classList.add("favourite-btn-icon");
    favIcon.innerHTML = "&#10084;&#65039;";
    favIcon.addEventListener("click", mealApp.toggleMealInFavourites);
    listItem.appendChild(favIcon);
    return listItem;
  },

  ///////////////////// Functions for details page /////////////////////

  // Uses API to get details of meal using it's ID
  getMealDetails: (id) => {
    let mealURL = mealApp.baseURL + "lookup.php?i=" + id;
    mealApp
      .mealAPI(mealURL)
      .then((data) => {
        // Adding meal details to DOM
        if (data) mealApp.addMealDetailsToDOM(data.meals[0]);
      })
      .catch((message) => {
        // Adding an error message to the content in case API returns rejected promise
        document.querySelector("main").innerHTML = `
        <h1 style="
            color:var(--link-font-color);
            font-size:4rem;
          ">
          ${message}
        </h1>`;
      });
  },

  addMealDetailsToDOM: (meal) => {
    if (meal) {
      var count = 1; // Serves as a counter for ingredients and its measures
      const ingredients = []; // Initializing ingredients array

      // Getting favourite meals list from localstorage
      let favourites = JSON.parse(localStorage.getItem("favourites"));

      // Adding ingredient and its measure while neither of them are either empty string or null
      while (
        meal["strMeasure" + count] != "" &&
        meal["strMeasure" + count] != null &&
        meal["strIngredient" + count] != "" &&
        meal["strIngredient" + count] != null
      ) {
        let ingredient = {};
        ingredient.amount = meal["strMeasure" + count];
        ingredient.name = meal["strIngredient" + count];
        ingredients.push(ingredient);
        count++;
      }

      // splitting and trimming the instructions and storing it as an array
      var instructions = meal.strInstructions
        .split(".")
        .map((item) => item.trim())
        .filter(Boolean);

      // Creating the list item in parts using template literals
      const main = document.querySelector("main");
      const details = document.createElement("div");
      details.classList.add("details-container", "flex");
      details.innerHTML = `
        <h1 class="meal-name">${meal.strMeal}</h1>
        <br />
        <span class="meal-category">${meal.strCategory}</span>
        <br />
        <button 
          class="favourite-btn" 
          data-id= ${meal.idMeal} 
          data-favourite="${favourites.includes(
            meal.idMeal
          )}">Add to favourites</button>
        <br />
        <img
          class="meal-image"
          src="${meal.strMealThumb}"
          alt="${meal.strMeal}"
        />
      `;
      let mealIngredientsHTML = `
        <div class="meal-ingredients">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Ingredient</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Adding meal ingredients information
      ingredients.forEach((ingredient) => {
        mealIngredientsHTML += `
        <tr>
          <td>${ingredient.amount}</td>
          <td>${ingredient.name}</td>
        </tr>
        `;
      });
      mealIngredientsHTML += `        
            </tbody>
          </table>
        </div>
        <div class="meal-recipe">
          <div class="meal-recipe-heading">Recipe</div>
      `;

      // Adding meal recipe steps
      instructions.forEach((instruction, index) => {
        mealIngredientsHTML += `
        <div class="meal-resipe-step">
          <span class="step-index">Step ${index + 1}. </span>
          ${instruction}
        </div>
        `;
      });

      mealIngredientsHTML += `        
      </div>
      `;
      details.innerHTML += mealIngredientsHTML;
      main.appendChild(details);

      // Adding event listener to the favourite button
      document
        .querySelector(".favourite-btn")
        .addEventListener("click", mealApp.toggleMealInFavourites);
    }
  },

  ///////////////////// Functions for favourites page /////////////////////

  // Function for fetching meal details of each mealID stored in the favourites list
  // All of the details can also be stored in favourites list but this approach is to make sure that the meals details are upto date
  getFavourites: () => {

    // Getting favourite meals list from localstorage
    const favourites = JSON.parse(localStorage.getItem("favourites"));
    const favList = document.querySelector(".favourites-list");
    favourites.forEach((id) => {
      const query = "lookup.php?i=" + id;
      const mealURL = mealApp.baseURL + query;
      // getting meal details of each meal and adding it to the DOM
      mealApp
        .mealAPI(mealURL)
        .then((data) => {
          if (data) {
            const li = mealApp.createListItemFavourites(data.meals[0]);
            favList.appendChild(li);
          }
        })
        .catch(console.log);
    });
  },

  // Function for creating a list item for favourites from the meal information
  createListItemFavourites: (meal) => {
    // Getting favourites list from localstorage
    const favourites = JSON.parse(localStorage.getItem("favourites"));

    // Creating list item using meal information
    const listItem = document.createElement("li");
    listItem.classList.add("favourite-item", "flex");
    listItem.innerHTML = `
            <a href="details.html?id=${meal.idMeal}" class="flex">
              <img
                src="${meal.strMealThumb}"
                alt="thumbnail"
              />
              <span class="details-container flex">
                <span class="meal-name">${meal.strMeal}</span>
                <span class="meal-category ${meal.strCategory}">${meal.strCategory}</span>
              </span>
            </a>
        `;
    const favIcon = document.createElement("button");

    // Setting data-favourite attribute based on whether the meal is already in favourites or not
    favIcon.setAttribute("data-favourite", favourites.includes(meal.idMeal));
    favIcon.setAttribute("data-id", meal.idMeal);
    favIcon.classList.add("favourite-btn-icon");
    favIcon.innerHTML = "&#10084;&#65039;"; // Creating favourite icon using heart emoji
    favIcon.addEventListener("click", (e) => {
      setTimeout(() => {
        // The function to remove meal from favourites will be called after delay for the animation to play out
        // The delay depends on the length of removing animation
        mealApp.toggleMealInFavourites(e);
      }, 1200);
    });
    listItem.appendChild(favIcon);

    // Returns the completed list item
    return listItem;
  },
};

// Calls init function for initializing the app
mealApp.init();
