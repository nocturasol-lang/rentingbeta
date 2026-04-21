export const amenityList = [
  // Essentials
  { key: 'wifi', label: 'Free WiFi', category: 'Essentials' },
  { key: 'air_conditioning', label: 'Air Conditioning', category: 'Essentials' },
  { key: 'air_conditioning_every_room', label: 'AC Every Room', category: 'Essentials' },
  { key: 'heating', label: 'Heating', category: 'Essentials' },
  { key: 'hot_water', label: 'Hot Water', category: 'Essentials' },

  // Bedroom
  { key: 'bed_linens', label: 'Bed Linens', category: 'Bedroom' },
  { key: 'towels', label: 'Towels', category: 'Bedroom' },
  { key: 'hangers', label: 'Hangers', category: 'Bedroom' },
  { key: 'wardrobe_closet', label: 'Wardrobe / Closet', category: 'Bedroom' },
  { key: 'extra_pillows_blankets', label: 'Extra Pillows & Blankets', category: 'Bedroom' },
  { key: 'blackout_curtains', label: 'Blackout Curtains', category: 'Bedroom' },

  // Bathroom
  { key: 'walk_in_shower', label: 'Walk-in Shower', category: 'Bathroom' },
  { key: 'bathtub', label: 'Bathtub', category: 'Bathroom' },
  { key: 'hair_dryer', label: 'Hair Dryer', category: 'Bathroom' },
  { key: 'toiletries', label: 'Toiletries', category: 'Bathroom' },
  { key: 'shampoo_conditioner', label: 'Shampoo & Conditioner', category: 'Bathroom' },
  { key: 'body_soap', label: 'Body Soap', category: 'Bathroom' },

  // Kitchen
  { key: 'fully_equipped_kitchen', label: 'Full Kitchen', category: 'Kitchen' },
  { key: 'kitchenette', label: 'Kitchenette', category: 'Kitchen' },
  { key: 'refrigerator', label: 'Refrigerator', category: 'Kitchen' },
  { key: 'stove', label: 'Stove / Hob', category: 'Kitchen' },
  { key: 'oven', label: 'Oven', category: 'Kitchen' },
  { key: 'microwave', label: 'Microwave', category: 'Kitchen' },
  { key: 'dishwasher', label: 'Dishwasher', category: 'Kitchen' },
  { key: 'coffee_machine', label: 'Coffee Machine', category: 'Kitchen' },
  { key: 'coffee_machine_pods', label: 'Pod Coffee Machine', category: 'Kitchen' },
  { key: 'kettle', label: 'Kettle', category: 'Kitchen' },
  { key: 'toaster', label: 'Toaster', category: 'Kitchen' },
  { key: 'cooking_basics', label: 'Cooking Basics', category: 'Kitchen' },
  { key: 'dishes_cutlery', label: 'Dishes & Cutlery', category: 'Kitchen' },

  // Entertainment
  { key: 'tv', label: 'TV', category: 'Entertainment' },
  { key: 'tv_every_room', label: 'TV Every Room', category: 'Entertainment' },
  { key: 'smart_tv', label: 'Smart TV', category: 'Entertainment' },
  { key: 'netflix', label: 'Netflix', category: 'Entertainment' },
  { key: 'streaming_services', label: 'Streaming Services', category: 'Entertainment' },
  { key: 'satellite_tv', label: 'Satellite TV', category: 'Entertainment' },
  { key: 'books_games', label: 'Books & Board Games', category: 'Entertainment' },

  // Facilities
  { key: 'washing_machine', label: 'Washing Machine', category: 'Facilities' },
  { key: 'dryer', label: 'Clothes Dryer', category: 'Facilities' },
  { key: 'clothes_rack', label: 'Clothes Drying Rack', category: 'Facilities' },
  { key: 'iron_ironing_board', label: 'Iron & Ironing Board', category: 'Facilities' },
  { key: 'work_desk', label: 'Work Desk', category: 'Facilities' },
  { key: 'safe', label: 'Safe', category: 'Facilities' },

  // Outdoor
  { key: 'balcony', label: 'Balcony', category: 'Outdoor' },
  { key: 'terrace', label: 'Terrace', category: 'Outdoor' },
  { key: 'garden', label: 'Garden', category: 'Outdoor' },
  { key: 'outdoor_furniture', label: 'Outdoor Furniture', category: 'Outdoor' },
  { key: 'outdoor_seating', label: 'Outdoor Seating', category: 'Outdoor' },
  { key: 'outdoor_dining', label: 'Outdoor Dining Area', category: 'Outdoor' },
  { key: 'bbq', label: 'BBQ', category: 'Outdoor' },
  { key: 'sun_loungers', label: 'Sun Loungers', category: 'Outdoor' },

  // Views
  { key: 'sea_view', label: 'Sea View', category: 'Views' },
  { key: 'mountain_view', label: 'Mountain View', category: 'Views' },
  { key: 'garden_view', label: 'Garden View', category: 'Views' },
  { key: 'hill_view', label: 'Hill View', category: 'Views' },
  { key: 'city_view', label: 'City View', category: 'Views' },

  // Parking
  { key: 'free_parking', label: 'Free Parking', category: 'Parking' },
  { key: 'street_parking', label: 'Street Parking', category: 'Parking' },
  { key: 'ev_charging', label: 'EV Charging', category: 'Parking' },

  // Access
  { key: 'self_checkin', label: 'Self Check-in', category: 'Access' },
  { key: 'private_entrance', label: 'Private Entrance', category: 'Access' },
  { key: 'luggage_storage', label: 'Luggage Storage', category: 'Access' },

  // Safety
  { key: 'smoke_alarm', label: 'Smoke Alarm', category: 'Safety' },
  { key: 'fire_extinguisher', label: 'Fire Extinguisher', category: 'Safety' },
  { key: 'first_aid_kit', label: 'First Aid Kit', category: 'Safety' },

  // Rules & Policies
  { key: 'non_smoking', label: 'Non-smoking', category: 'Rules' },
  { key: 'pet_friendly', label: 'Pet Friendly', category: 'Rules' },
] as const

export const amenityLabels: Record<string, string> = Object.fromEntries(
  amenityList.map((a) => [a.key, a.label])
)

export const amenityCategories = [...new Set(amenityList.map((a) => a.category))]
