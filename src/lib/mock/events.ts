export type UIMockEvent = {
  id: string;
  title: string;
  theme: string;
  city: string;
  locality: string;
  dateLabel: string;
  timeLabel: string;
  priceFrom: number;
  seatsLeft: number;
  foodTags: string[];
  games: string[];
  hostName: string;
  hostRating: number;
  verified: boolean;
};

export const mockEvents: UIMockEvent[] = [
  {
    id: "evt_vegan_sunset",
    title: "Vegan Sunset Table",
    theme: "Seasonal sharing plates + stories",
    city: "Bengaluru",
    locality: "Indiranagar",
    dateLabel: "Sat, 24 Feb",
    timeLabel: "7:00 PM – 9:30 PM",
    priceFrom: 799,
    seatsLeft: 6,
    foodTags: ["Vegan", "No alcohol", "Allergy friendly"],
    games: ["Uno", "Codenames"],
    hostName: "Aanya",
    hostRating: 4.8,
    verified: true
  },
  {
    id: "evt_bbq_game_night",
    title: "BBQ & Board Games Night",
    theme: "Charcoal grill + playful competition",
    city: "Mumbai",
    locality: "Bandra",
    dateLabel: "Fri, 1 Mar",
    timeLabel: "8:00 PM – 11:00 PM",
    priceFrom: 1199,
    seatsLeft: 3,
    foodTags: ["BBQ", "Non-veg options", "Spice levels"],
    games: ["Ludo", "Exploding Kittens"],
    hostName: "Rohan",
    hostRating: 4.6,
    verified: true
  },
  {
    id: "evt_italian_pasta_club",
    title: "Italian Pasta Club",
    theme: "Handmade pasta + cozy conversation",
    city: "Delhi",
    locality: "Hauz Khas",
    dateLabel: "Sun, 3 Mar",
    timeLabel: "1:00 PM – 3:30 PM",
    priceFrom: 999,
    seatsLeft: 10,
    foodTags: ["Vegetarian", "Italian", "Beginner friendly"],
    games: ["Jenga"],
    hostName: "Meera",
    hostRating: 4.9,
    verified: false
  }
];

