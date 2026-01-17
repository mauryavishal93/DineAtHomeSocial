"use client";

import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const sampleCommunities = [
  {
    name: "Vegan Foodies Delhi",
    description: "Plant-based dining experiences across Delhi NCR",
    category: "DIETARY",
    memberCount: 342,
    tags: ["vegan", "delhi", "healthy"]
  },
  {
    name: "Weekend Wine Enthusiasts",
    description: "Explore wine pairings with gourmet meals every weekend",
    category: "LIFESTYLE",
    memberCount: 156,
    tags: ["wine", "weekend", "gourmet"]
  },
  {
    name: "Board Game Dining Club",
    description: "Combine great food with classic and modern board games",
    category: "ACTIVITY",
    memberCount: 89,
    tags: ["games", "social", "fun"]
  },
  {
    name: "Solo Travelers Meetup",
    description: "Connect with fellow solo travelers over authentic local meals",
    category: "DEMOGRAPHIC",
    memberCount: 234,
    tags: ["travel", "solo", "networking"]
  },
  {
    name: "Mumbai Street Food Lovers",
    description: "Celebrating Mumbai's incredible street food culture",
    category: "CUISINE",
    memberCount: 521,
    tags: ["street-food", "mumbai", "authentic"]
  },
  {
    name: "South Indian Food Heritage",
    description: "Traditional South Indian recipes and dining experiences",
    category: "CUISINE",
    memberCount: 278,
    tags: ["south-indian", "traditional", "heritage"]
  }
];

export default function CommunitiesPage() {
  return (
    <main className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight text-ink-900">
            Dining Communities
          </h1>
          <p className="mt-2 text-ink-700">
            Join communities of like-minded food lovers and get exclusive access to special events
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Button variant="outline" size="sm">All</Button>
          <Button variant="ghost" size="sm">Cuisine</Button>
          <Button variant="ghost" size="sm">Lifestyle</Button>
          <Button variant="ghost" size="sm">Dietary</Button>
          <Button variant="ghost" size="sm">Activity</Button>
          <Button variant="ghost" size="sm">Demographic</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sampleCommunities.map((community, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur transition-shadow hover:shadow-lg"
            >
              <div className="h-32 bg-gradient-to-br from-sand-100 via-white to-sand-50" />
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="font-display text-xl text-ink-900">{community.name}</h3>
                  <div className="mt-2">
                    <Badge tone="ink">{community.category}</Badge>
                  </div>
                </div>

                <p className="mb-4 text-sm text-ink-700">{community.description}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {community.tags.map((tag) => (
                    <Badge key={tag} tone="success">{tag}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-ink-700">
                    <span className="font-medium text-ink-900">{community.memberCount}</span> members
                  </div>
                  <Button size="sm">Join Community</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-sand-200 bg-gradient-to-r from-sand-50 to-white p-8 shadow-soft">
          <h2 className="font-display text-2xl text-ink-900">Create Your Own Community</h2>
          <p className="mt-2 text-ink-700">
            Have a unique interest or dining preference? Start your own community and host exclusive events
          </p>
          <Button className="mt-4">Create Community</Button>
        </div>
      </Container>
    </main>
  );
}
