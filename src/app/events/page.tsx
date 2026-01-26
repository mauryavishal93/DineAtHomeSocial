"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { EventsGrid } from "@/components/events/events-grid";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getRole } from "@/lib/session";

type FilterOptions = {
  cities: string[];
  states: string[];
  localities: string[];
  cuisines: string[];
  activities: string[];
  dietary: string[];
  interests: string[];
};

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{
    cities: string[];
    localities: string[];
    states: string[];
    foods: string[];
    interests: string[];
    dietary: string[];
    activities: string[];
  }>({
    cities: [],
    localities: [],
    states: [],
    foods: [],
    interests: [],
    dietary: [],
    activities: []
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    cities: [],
    states: [],
    localities: [],
    cuisines: [],
    activities: [],
    dietary: [],
    interests: []
  });

  const [loadingFilters, setLoadingFilters] = useState(true);

  useEffect(() => {
    setMounted(true);
    setUserRole(getRole());
  }, []);

  // Fetch available filter options from API
  useEffect(() => {
    (async () => {
      try {
        setLoadingFilters(true);
        const res = await apiFetch<FilterOptions>("/api/events/filters", { method: "GET" });
        if (res.ok && res.data) {
          setFilterOptions(res.data);
        }
      } catch (error) {
        console.error("Failed to load filter options:", error);
      } finally {
        setLoadingFilters(false);
      }
    })();
  }, []);

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      const isSelected = current.includes(value);
      return {
        ...prev,
        [category]: isSelected
          ? current.filter(v => v !== value)
          : [...current, value]
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      cities: [],
      localities: [],
      states: [],
      foods: [],
      interests: [],
      dietary: [],
      activities: []
    });
  };

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

  // Convert to API format - memoized to ensure proper re-renders
  const activeFilters = useMemo(() => {
    const filters: {
      cities?: string[];
      localities?: string[];
      states?: string[];
      cuisines?: string[];
      interests?: string[];
      dietary?: string[];
      activities?: string[];
    } = {};

    if (selectedFilters.cities.length > 0) filters.cities = [...selectedFilters.cities];
    if (selectedFilters.localities.length > 0) filters.localities = [...selectedFilters.localities];
    if (selectedFilters.states.length > 0) filters.states = [...selectedFilters.states];
    if (selectedFilters.foods.length > 0) filters.cuisines = [...selectedFilters.foods];
    if (selectedFilters.interests.length > 0) filters.interests = [...selectedFilters.interests];
    if (selectedFilters.dietary.length > 0) filters.dietary = [...selectedFilters.dietary];
    if (selectedFilters.activities.length > 0) filters.activities = [...selectedFilters.activities];

    const hasFilters = Object.keys(filters).length > 0;
    return hasFilters ? filters : undefined;
  }, [
    selectedFilters.cities,
    selectedFilters.localities,
    selectedFilters.states,
    selectedFilters.foods,
    selectedFilters.interests,
    selectedFilters.dietary,
    selectedFilters.activities
  ]);

  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 flex-1">
            <div className="text-sm font-medium text-ink-700">Explore</div>
            <h1 className="font-display text-4xl tracking-tight text-ink-900">
              Events near you
            </h1>
            <p className="max-w-2xl text-sm text-ink-700">
              Click on filters below to search events. Multiple selections allowed in each category.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            {mounted && userRole === "HOST" && (
              <Button size="lg" asChild>
                <Link href="/host/events/new">Create an Event</Link>
              </Button>
            )}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear All Filters
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-2xl border border-sand-200 bg-white/50 p-5 shadow-soft backdrop-blur max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-5">
              <div className="font-medium text-ink-900">Filters</div>
              
              {loadingFilters ? (
                <div className="text-sm text-ink-600">Loading filter options...</div>
              ) : (
                <>
                  {/* Location Filters */}
                  {filterOptions.cities.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        📍 Location - City ({filterOptions.cities.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.cities.map((city) => {
                          const isSelected = selectedFilters.cities.includes(city);
                          return (
                            <Badge
                              key={city}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md"
                                  : "hover:bg-violet-100 border-violet-200"
                              }`}
                              onClick={() => toggleFilter("cities", city)}
                            >
                              {city}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filterOptions.states.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        📍 Location - State ({filterOptions.states.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.states.map((state) => {
                          const isSelected = selectedFilters.states.includes(state);
                          return (
                            <Badge
                              key={state}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md"
                                  : "hover:bg-violet-100 border-violet-200"
                              }`}
                              onClick={() => toggleFilter("states", state)}
                            >
                              {state}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filterOptions.localities.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        📍 Location - Locality ({filterOptions.localities.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.localities.slice(0, 20).map((locality) => {
                          const isSelected = selectedFilters.localities.includes(locality);
                          return (
                            <Badge
                              key={locality}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md"
                                  : "hover:bg-violet-100 border-violet-200"
                              }`}
                              onClick={() => toggleFilter("localities", locality)}
                            >
                              {locality}
                            </Badge>
                          );
                        })}
                        {filterOptions.localities.length > 20 && (
                          <div className="text-xs text-ink-500">+{filterOptions.localities.length - 20} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Food Filter */}
                  {filterOptions.cuisines.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        🍽️ Food / Cuisine ({filterOptions.cuisines.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.cuisines.map((food) => {
                          const isSelected = selectedFilters.foods.includes(food);
                          return (
                            <Badge
                              key={food}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md"
                                  : "hover:bg-violet-100 border-violet-200"
                              }`}
                              onClick={() => toggleFilter("foods", food)}
                            >
                              {food}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interests Filter */}
                  {filterOptions.interests.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        🎯 Interests ({filterOptions.interests.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.interests.map((interest) => {
                          const isSelected = selectedFilters.interests.includes(interest);
                          return (
                            <Badge
                              key={interest}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md"
                                  : "hover:bg-violet-100 border-violet-200"
                              }`}
                              onClick={() => toggleFilter("interests", interest)}
                            >
                              {interest}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dietary Filter */}
                  {filterOptions.dietary.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        🥗 Dietary ({filterOptions.dietary.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.dietary.map((diet) => {
                          const isSelected = selectedFilters.dietary.includes(diet);
                          return (
                            <Badge
                              key={diet}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md"
                                  : "hover:bg-violet-100 border-violet-200"
                              }`}
                              onClick={() => toggleFilter("dietary", diet)}
                            >
                              {diet}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Activity Filter */}
                  {filterOptions.activities.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        🎮 Activity ({filterOptions.activities.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.activities.map((activity) => {
                          const isSelected = selectedFilters.activities.includes(activity);
                          return (
                            <Badge
                              key={activity}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md"
                                  : "hover:bg-violet-100 border-violet-200"
                              }`}
                              onClick={() => toggleFilter("activities", activity)}
                            >
                              {activity}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {hasActiveFilters && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-xs text-ink-700 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-sm">Active Filters:</div>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFilters.cities.map((city) => (
                      <Badge
                        key={`city-${city}`}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("cities", city);
                        }}
                      >
                        <span className="mr-1">📍 {city}</span>
                        <svg
                          className="h-3 w-3 inline-block group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Badge>
                    ))}
                    {selectedFilters.states.map((state) => (
                      <Badge
                        key={`state-${state}`}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("states", state);
                        }}
                      >
                        <span className="mr-1">📍 {state}</span>
                        <svg
                          className="h-3 w-3 inline-block group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Badge>
                    ))}
                    {selectedFilters.localities.map((locality) => (
                      <Badge
                        key={`locality-${locality}`}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("localities", locality);
                        }}
                      >
                        <span className="mr-1">📍 {locality}</span>
                        <svg
                          className="h-3 w-3 inline-block group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Badge>
                    ))}
                    {selectedFilters.foods.map((food) => (
                      <Badge
                        key={`food-${food}`}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("foods", food);
                        }}
                      >
                        <span className="mr-1">🍽️ {food}</span>
                        <svg
                          className="h-3 w-3 inline-block group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Badge>
                    ))}
                    {selectedFilters.interests.map((interest) => (
                      <Badge
                        key={`interest-${interest}`}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("interests", interest);
                        }}
                      >
                        <span className="mr-1">🎯 {interest}</span>
                        <svg
                          className="h-3 w-3 inline-block group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Badge>
                    ))}
                    {selectedFilters.dietary.map((diet) => (
                      <Badge
                        key={`dietary-${diet}`}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("dietary", diet);
                        }}
                      >
                        <span className="mr-1">🥗 {diet}</span>
                        <svg
                          className="h-3 w-3 inline-block group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Badge>
                    ))}
                    {selectedFilters.activities.map((activity) => (
                      <Badge
                        key={`activity-${activity}`}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("activities", activity);
                        }}
                      >
                        <span className="mr-1">🎮 {activity}</span>
                        <svg
                          className="h-3 w-3 inline-block group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-5">
            <EventsGrid 
              key={JSON.stringify(activeFilters || {})} 
              filters={activeFilters} 
            />
            {!hasActiveFilters && !loadingFilters && (
              <div className="rounded-2xl border border-sand-200 bg-white/50 p-5 text-sm text-ink-700 shadow-soft backdrop-blur">
                Click on the filter options on the left to search for events. You can select multiple options in each category.
              </div>
            )}
            {hasActiveFilters && !loadingFilters && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3 text-xs text-ink-700">
                Showing filtered results. Clear filters to see all events.
              </div>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}
