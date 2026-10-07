import zukasMenuPoster from "../assets/zukas_menu_poster.jpg";
import margheritaImg from "../assets/pizzas/margherita.jpg";
import cheeseCornImg from "../assets/pizzas/cheese_corn.jpg";
import vegPizzaImg from "../assets/pizzas/veg_pizza.jpg";
import vegCheeseCornImg from "../assets/pizzas/veg_cheese_corn.jpg";
import paneerTikkaImg from "../assets/pizzas/paneer_tikka.jpg";
import chickenTikkaImg from "../assets/pizzas/chicken_tikka.jpg";

export const menuHeader = {
  title: "From Our Kitchen to You",
  openingTime: "Mon-Fri: 2 PM - 9 PM | Sat-Sun: 9 AM - 9 PM",
  tagline: "HOT & FRESH PIZZA DELIVERED TO YOUR DOORSTEP",
  phone: "9194130132",
  posterImage: zukasMenuPoster,
};

export const pizzaMenuItems = [
  {
    id: "pizza-margherita",
    name: "Pizza Margherita",
    description: "Cheese",
    isVeg: true,
    image: margheritaImg,
    prices: {
      small: 99,
      medium: 139,
    },
  },
  {
    id: "pizza-cheese-corn",
    name: "Pizza Cheese Corn",
    description: "Cheese & sweet corn",
    isVeg: true,
    image: cheeseCornImg,
    prices: {
      small: 119,
      medium: 149,
    },
  },
  {
    id: "pizza-veg-pizza",
    name: "Pizza Veg Pizza",
    description: "Cheese, Onion, capsicum and tomato",
    isVeg: true,
    image: vegPizzaImg,
    prices: {
      small: 139,
      medium: 179,
    },
  },
  {
    id: "pizza-veg-cheese-corn",
    name: "Pizza Veg Cheese Corn",
    description: "Cheese, Onion, capsicum & sweet corn",
    isVeg: true,
    image: vegCheeseCornImg,
    prices: {
      small: 149,
      medium: 189,
    },
  },
  {
    id: "pizza-paneer-tikka",
    name: "Pizza Paneer Tikka",
    description: "Cheese, Onion, capsicum & paneer tikka",
    isVeg: true,
    image: paneerTikkaImg,
    prices: {
      small: 159,
      medium: 199,
    },
  },
  {
    id: "pizza-chicken-tikka",
    name: "Pizza Chicken Tikka",
    description: "Cheese, Onion, capsicum & chicken tikka",
    isVeg: false,
    image: chickenTikkaImg,
    prices: {
      small: 169,
      medium: 209,
    },
  },
];

export const extraAddons = [
  {
    id: "extra-cheese",
    name: "Extra Cheese",
    price: 25,
  },
];
