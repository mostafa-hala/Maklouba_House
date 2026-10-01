/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  name: string;
  description?: string;
  price: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menu: MenuSection[] = [
  {
    title: "Appetizers",
    items: [
      { name: "Maklouba House Mezza", description: "Hummus, Babaganoush, Mahammara, Mozzarella Sticks, Kebbeh", price: "35" },
      { name: "Hummus", price: "8" },
      { name: "Babaganoush", price: "8" },
      { name: "Mahammara", price: "8" },
      { name: "Bakdonsia", price: "8" },
      { name: "Labneh", price: "8" },
      { name: "Msabha", price: "8" },
    ]
  },
  {
    title: "Hot Appetizers",
    items: [
      { name: "Falafel (3pcs)", price: "2" },
      { name: "Fried Vegetables", price: "12" },
      { name: "Mozzarella Sticks (8pcs)", price: "12" },
      { name: "Fried Cheese", price: "8" },
      { name: "Fried Kebbeh (4pcs)", price: "12" },
      { name: "Soujak", price: "12" },
      { name: "Aryees (3pcs - Meat, Cheese)", price: "12" },
      { name: "Pastrami & Eggs", price: "12" },
      { name: "Bourak (4pcs)", price: "12" },
      { name: "Fateh Hummus (with meat)", price: "13" },
      { name: "Tomato Pot (with meat +$4)", price: "9" },
      { name: "Eijjuh", price: "9" },
      { name: "Potato & Eggs", price: "9" },
      { name: "Foul", price: "9" },
      { name: "Liver (chicken, meat)", price: "13" },
    ]
  },
  {
    title: "Entrees",
    items: [
      { name: "Family Maklouba House Special", description: "4 Kofta, 4 Shish Kebab, 4 Chicken Taouk, 4 Lamb Chops, 4 Chicken Chops, Chicken & Beef Shawerma, Two Halfs Roasted Chicken", price: "200" },
      { name: "Maklouba House Special", description: "4 Kofta, 4 Shish Kebab, 4 Chicken Taouk, 4 Lamb Chops, 4 Chicken Chops, Chicken & Beef Shawerma", price: "170" },
      { name: "Family Mix", description: "4 Kofta Kebab, 4 Shish Taouk, 4 Shish Kebab, Shawerma Chicken, Shawerma Beef", price: "140" },
      { name: "Mix Platter (2 People)", description: "2 Kofta Kebab, 2 Shish Taouk, 2 Shish Kebab, Shawerma Chicken, Shawerma Beef", price: "65" },
      { name: "Mix Platter (1 Person)", description: "1 Kofta Kebab, 1 Shish Kebab, 1 Lamb Chop, 1 Chicken Taouk", price: "35" },
      { name: "Shish Kabab", price: "29" },
      { name: "Ribeye Shish Kabab", price: "35" },
      { name: "Lamb Shish Kabab", price: "30" },
      { name: "Lamb Chops", price: "35" },
      { name: "Lamb Liver", price: "25" },
      { name: "Shish Taouk", price: "25" },
      { name: "Kofta Kabab", price: "25" },
      { name: "Beef Shawerma", price: "22" },
      { name: "Chicken Shawerma", price: "18" },
      { name: "Chicken Chops", price: "25" },
      { name: "Grilled Chicken Wings (8 Pcs)", price: "25" },
      { name: "T-Bone Steak", price: "55" },
      { name: "Ribeye Steak", price: "50" },
    ]
  },
  {
    title: "House Special",
    items: [
      { name: "Maklouba Size 1 (1-2 people) Chicken", price: "40" },
      { name: "Maklouba Size 1 (1-2 people) Meat", price: "50" },
      { name: "Maklouba Size 2 (2-4 people) Chicken", price: "50" },
      { name: "Maklouba Size 2 (2-4 people) Meat", price: "60" },
      { name: "Maklouba Size 3 (4-8 people) Chicken", price: "80" },
      { name: "Maklouba Size 3 (4-8 people) Meat", price: "120" },
      { name: "Maklouba Size 4 (7-10 people) Chicken", price: "120" },
      { name: "Maklouba Size 4 (7-10 people) Meat", price: "150" },
      { name: "Qidra Chicken", price: "25" },
      { name: "Qidra Lamb", price: "30" },
      { name: "Roasted Whole Chicken", price: "25" },
      { name: "Roasted Half Chicken", price: "17" },
      { name: "Mussakhan Chicken", price: "25" },
      { name: "Ouzi Chicken", price: "25" },
      { name: "Ouzi Lamb", price: "30" },
      { name: "Mandi Chicken", price: "25" },
      { name: "Mandi Lamb", price: "30" },
    ]
  },
  {
    title: "Smoked Meat (Price Per Pound)",
    items: [
      { name: "Lamb Ribs", price: "35" },
      { name: "Beef Ribs", price: "35" },
      { name: "Brisket", price: "35" },
      { name: "Lamb Shoulder", price: "35" },
      { name: "Lamb Neck", price: "35" },
      { name: "Lamb Shank", price: "35" },
    ]
  },
  {
    title: "Salad",
    items: [
      { name: "House Special Salad", description: "Arugula, Cherry Tomato, Cucumber, Green Apple, Raisin, Pecan, Avocado", price: "15" },
      { name: "Fattoush", price: "10" },
      { name: "Arabic Salad", price: "10" },
      { name: "Tahini Salad", price: "10" },
      { name: "Cucumber Yogurt Salad", price: "10" },
      { name: "Greek Salad", price: "10" },
      { name: "Tabouleh", price: "10" },
    ]
  },
  {
    title: "Sandwich",
    items: [
      { name: "Maklouba Special Sandwich", description: "1 Chicken Shawerma, 1 Chicken Taouk, 1 Kofta Kebab", price: "25" },
      { name: "Falafel", price: "8" },
      { name: "Beef Shawerma", price: "12" },
      { name: "Chicken Shawerma", price: "10" },
      { name: "Kofta Kebab", price: "10" },
      { name: "Shish Kebab", price: "14" },
      { name: "Chicken Kebab", price: "12" },
    ]
  },
  {
    title: "Manakeesh",
    items: [
      { name: "Zaatar", price: "8.99" },
      { name: "Cheese", price: "8.99" },
      { name: "Meat", price: "8.99" },
      { name: "Muhamara", price: "8.99" },
      { name: "Pizza", price: "8.99" },
    ]
  },
  {
    title: "Soup",
    items: [
      { name: "Lentil Soup", price: "6" },
    ]
  },
  {
    title: "Kids Meal",
    items: [
      { name: "Chicken Nuggets (6pcs)", price: "12" },
      { name: "Chicken Tender (4pcs)", price: "12" },
      { name: "Chicken Wings (5pcs)", price: "12" },
      { name: "Mozzarella Sticks (6pcs)", price: "12" },
    ]
  },
  {
    title: "Sides",
    items: [
      { name: "Rice", price: "5" },
      { name: "Fries", price: "5" },
    ]
  },
  {
    title: "Drinks",
    items: [
      { name: "Soda", price: "3" },
      { name: "Juice", description: "Orange, Mixed Fruits, Mango, Lemonade, Pink Lemonade", price: "4" },
      { name: "Lemon Mint", price: "8" },
      { name: "Mojito", price: "8" },
    ]
  }
];
