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
        var query = window.location.search;
        const urlParams = new URLSearchParams(query);
        const id = urlParams.get("id");
        if (id) {
          mealApp.getMealDetails(id);
        } else {
          // Handle errors later
        }
        break;
      case "favourites":
        mealApp.getFavourites();
    }
  },
  debounce: function (fn, delay) {
    let timer;
    return function () {
      let context = this,
        args = arguments;
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(context, arguments);
      }, delay);
    };
  },
  mealAPI: async (mealURL) => {
    const response = await fetch(mealURL);
    if (response.ok) {
      const responseJSON = await response.json();
      return Promise.resolve(responseJSON);
    } else {
      return Promise.reject("No meals found");
    }
  },
  getMealDetails: (id) => {
    let mealURL = mealApp.baseURL + "lookup.php?i=" + id;
    mealApp.mealAPI(mealURL).then((data) => {
      if (data) mealApp.addMealDetailsToDOM(data.meals[0]);
    });
  },
  getMealSuggestions: (e) => {
    let partialInput = e.target.value;
    let mealURL = mealApp.baseURL + "search.php?s=" + partialInput;

    mealApp
      .mealAPI(mealURL)
      .then((data) => {
        if (partialInput === "") data.meals = [];
        if (data) mealApp.addMealsToSuggestions(data.meals);
      })
      .catch(console.log);
  },
  addMealsToSuggestions: (meals) => {
    let searchSuggestions = document.querySelector("#search-results");
    searchSuggestions.innerHTML = "";
    let favourites = JSON.parse(localStorage.getItem("favourites"));
    if (meals) {
      meals.forEach((meal) => {
        const listItem = mealApp.createListItemSuggestions(meal, favourites);
        searchSuggestions.appendChild(listItem);
      });
    } else {
      const listItem = document.createElement("li");
      listItem.classList.add("search-result", "flex");
      listItem.innerHTML = `<span>No meals found</span>`;
      searchSuggestions.append(listItem);
    }
  },
  createListItemSuggestions: (meal, favourites) => {
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
    favIcon.setAttribute(
      "data-favourite",
      favourites.includes(meal.idMeal) ? true : false
    );
    favIcon.setAttribute("data-id", meal.idMeal);
    favIcon.classList.add("favourite-btn-icon");
    favIcon.innerHTML = "&#10084;&#65039;";
    favIcon.addEventListener("click", mealApp.toggleMealInFavourites);
    listItem.appendChild(favIcon);
    return listItem;
  },
  addMealDetailsToDOM: (meal) => {
    if (meal) {
      var count = 1;
      const ingredients = [];
      let favourites = JSON.parse(localStorage.getItem("favourites"));
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
      var instructions = meal.strInstructions
        .split(".")
        .map((item) => item.trim())
        .filter(Boolean);

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
          data-favourite="${
            favourites.includes(meal.idMeal) ? true : false
          }">Add to favourites</button>
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
  getFavourites: () => {
    const favourites = JSON.parse(localStorage.getItem("favourites"));
    const favList = document.querySelector(".favourites-list");
    favourites.forEach((id) => {
      const query = "lookup.php?i=" + id;
      const mealURL = mealApp.baseURL + query;
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
  createListItemFavourites: (meal) => {
    const listItem = document.createElement("li");
    const favourites = JSON.parse(localStorage.getItem("favourites"));
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
    favIcon.setAttribute(
      "data-favourite",
      favourites.includes(meal.idMeal) ? true : false
    );
    favIcon.setAttribute("data-id", meal.idMeal);
    favIcon.classList.add("favourite-btn-icon");
    favIcon.innerHTML = "&#10084;&#65039;";
    favIcon.addEventListener("click", mealApp.removeMealFromFavourites);
    listItem.appendChild(favIcon);
    return listItem;
  },
  toggleMealInFavourites: (e) => {
    let favourites = JSON.parse(localStorage.getItem("favourites"));
    const index = favourites.indexOf(e.target.dataset.id);
    if (index == -1) {
      favourites = [...favourites, e.target.dataset.id];
    } else {
      favourites.splice(index, 1);
    }
    localStorage.setItem("favourites", JSON.stringify(favourites));
    e.target.setAttribute(
      "data-favourite",
      favourites.includes(e.target.dataset.id) ? true : false
    );
  },
  removeMealFromFavourites: (e) => {
    let favourites = JSON.parse(localStorage.getItem("favourites"));
    const index = favourites.indexOf(e.target.dataset.id);
    favourites.splice(index, 1);
    localStorage.setItem("favourites", JSON.stringify(favourites));
    e.target.parentElement.remove();
  },
};

mealApp.init();
