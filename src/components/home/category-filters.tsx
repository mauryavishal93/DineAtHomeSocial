"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";

interface CategoryFiltersProps {
  onFilterChange: (filters: {
    cuisines?: string[];
    activities?: string[];
    dietary?: string[];
  }) => void;
}

export function CategoryFilters({ onFilterChange }: CategoryFiltersProps) {
  const [categories, setCategories] = useState<{
    cuisines: string[];
    activities: string[];
    dietary: string[];
  }>({
    cuisines: [],
    activities: [],
    dietary: []
  });
  const [selected, setSelected] = useState<{
    cuisines: Set<string>;
    activities: Set<string>;
    dietary: Set<string>;
  }>({
    cuisines: new Set(),
    activities: new Set(),
    dietary: new Set()
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{
          cuisines: string[];
          activities: string[];
          dietary: string[];
        }>("/api/events/filters");
        if (res.ok && res.data) {
          setCategories({
            cuisines: res.data.cuisines.slice(0, 8),
            activities: res.data.activities.slice(0, 8),
            dietary: res.data.dietary.slice(0, 8)
          });
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    })();
  }, []);

  const toggleFilter = (type: "cuisines" | "activities" | "dietary", value: string) => {
    setSelected((prev) => {
      const newSelected = { ...prev };
      const set = new Set(newSelected[type]);
      
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      
      newSelected[type] = set;
      
      // Notify parent if callback exists
      if (onFilterChange && typeof onFilterChange === "function") {
        onFilterChange({
          cuisines: type === "cuisines" ? Array.from(newSelected.cuisines) : Array.from(selected.cuisines),
          activities: type === "activities" ? Array.from(newSelected.activities) : Array.from(selected.activities),
          dietary: type === "dietary" ? Array.from(newSelected.dietary) : Array.from(selected.dietary)
        });
      }
      
      return newSelected;
    });
  };

  const clearFilters = () => {
    setSelected({
      cuisines: new Set(),
      activities: new Set(),
      dietary: new Set()
    });
    if (onFilterChange && typeof onFilterChange === "function") {
      onFilterChange({});
    }
  };

  const hasActiveFilters = 
    selected.cuisines.size > 0 || 
    selected.activities.size > 0 || 
    selected.dietary.size > 0;

  return (
    <div className="space-y-6">
      {/* Cuisines */}
      {categories.cuisines.length > 0 && (
        <div>
          <div className="text-sm font-medium text-ink-700 mb-3">🍽️ Cuisines</div>
          <div className="flex flex-wrap gap-2">
            {categories.cuisines.map((cuisine) => (
              <Badge
                key={cuisine}
                tone={selected.cuisines.has(cuisine) ? "violet" : undefined}
                onClick={() => toggleFilter("cuisines", cuisine)}
                className={`cursor-pointer transition-all ${
                  selected.cuisines.has(cuisine)
                    ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                    : "hover:bg-violet-100"
                }`}
              >
                {cuisine}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {categories.activities.length > 0 && (
        <div>
          <div className="text-sm font-medium text-ink-700 mb-3">🎲 Activities</div>
          <div className="flex flex-wrap gap-2">
            {categories.activities.map((activity) => (
              <Badge
                key={activity}
                tone={selected.activities.has(activity) ? "orange" : undefined}
                onClick={() => toggleFilter("activities", activity)}
                className={`cursor-pointer transition-all ${
                  selected.activities.has(activity)
                    ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
                    : "hover:bg-orange-100"
                }`}
              >
                {activity}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dietary */}
      {categories.dietary.length > 0 && (
        <div>
          <div className="text-sm font-medium text-ink-700 mb-3">🌱 Dietary</div>
          <div className="flex flex-wrap gap-2">
            {categories.dietary.map((diet) => (
              <Badge
                key={diet}
                tone={selected.dietary.has(diet) ? "mint" : undefined}
                onClick={() => toggleFilter("dietary", diet)}
                className={`cursor-pointer transition-all ${
                  selected.dietary.has(diet)
                    ? "bg-gradient-to-r from-mint-500 to-sky-500 text-white"
                    : "hover:bg-mint-100"
                }`}
              >
                {diet}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div>
          <button
            onClick={clearFilters}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
