import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function About() {
  useEffect(() => {
    document.title = "About Us | DineAtHome Social";
    return () => {
      document.title = "DineAtHome Social";
    };
  }, []);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 pb-20 sm:py-16 sm:pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          About Us
        </h1>
        <p className="mt-2 text-lg text-ink-700">DineAtHomeSocial</p>
      </header>

      <div className="max-w-none space-y-10 text-ink-700">
        <section id="who-we-are">
          <h2 className="text-2xl font-semibold text-ink-900">Who We Are</h2>
          <p className="mt-3 leading-relaxed">
            DineAtHomeSocial is a community-driven platform that brings people together through shared home-dining experiences. We connect hosts who love cooking and hosting with guests who enjoy discovering food, meeting new people, and sharing meaningful moments around the table.
          </p>
        </section>

        <section id="our-story">
          <h2 className="text-2xl font-semibold text-ink-900">Our Story</h2>
          <div className="mt-3 space-y-3 leading-relaxed">
            <p>
              Food has always been more than just nourishment — it is how cultures connect, friendships begin, and memories are created.
            </p>
            <p>
              In a fast-moving, digital-first world, genuine human connections are becoming rare.
            </p>
            <p>
              DineAtHomeSocial was created to bring people back to the table — to real conversations, real food, and real experiences hosted in real homes.
            </p>
          </div>
        </section>

        <section id="our-mission">
          <h2 className="text-2xl font-semibold text-ink-900">Our Mission</h2>
          <p className="mt-3 leading-relaxed">
            Our mission is to connect people offline through food.
          </p>
          <p className="mt-3 leading-relaxed">
            We believe the strongest connections are built face-to-face. Through shared meals and welcoming homes, we help people form genuine relationships beyond screens and social media.
          </p>
        </section>

        <section id="what-we-do">
          <h2 className="text-2xl font-semibold text-ink-900">What We Do</h2>
          <p className="mt-3 leading-relaxed">
            DineAtHomeSocial enables hosts to create paid dining experiences — including breakfast, lunch, dinner, and parties — and allows guests to discover, book, and attend these experiences safely and transparently.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
            <li>Hosts list meals and events</li>
            <li>Guests book and pay online</li>
            <li>Everyone connects over food</li>
          </ul>
        </section>

        <section id="our-vision">
          <h2 className="text-2xl font-semibold text-ink-900">Our Vision</h2>
          <p className="mt-3 leading-relaxed">
            We envision a world where meals are more than routine, where strangers become friends, and where food becomes a bridge between people, cultures, and communities.
          </p>
        </section>

        <section id="why-dineathomesocial">
          <h2 className="text-2xl font-semibold text-ink-900">Why DineAtHomeSocial?</h2>
          <ul className="mt-4 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-xl">🏠</span>
              <span>Home-hosted dining experiences</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">🤝</span>
              <span>Focus on social connection, not just food</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">💳</span>
              <span>Secure and transparent payments</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">⭐</span>
              <span>Community reviews and ratings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">🔐</span>
              <span>Trust, safety, and respect at the core</span>
            </li>
          </ul>
        </section>

        <section id="who-is-it-for">
          <h2 className="text-2xl font-semibold text-ink-900">Who Is It For?</h2>
          
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-ink-900">Hosts</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              <li>Home cooks and food lovers</li>
              <li>People who enjoy hosting and sharing food</li>
              <li>Anyone who wants to earn by creating experiences</li>
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold text-ink-900">Guests</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              <li>Food explorers</li>
              <li>Students and professionals</li>
              <li>Solo diners and social seekers</li>
              <li>Locals and travelers</li>
            </ul>
          </div>
        </section>

        <section id="safety-trust">
          <h2 className="text-2xl font-semibold text-ink-900">Safety & Trust</h2>
          <p className="mt-3 leading-relaxed">
            We are committed to creating a safe and respectful community.
          </p>
          <p className="mt-3 leading-relaxed">
            Our platform includes verified profiles, secure payments, clear house rules, and transparent reviews to ensure trust for both hosts and guests.
          </p>
        </section>

        <section id="our-values">
          <h2 className="text-2xl font-semibold text-ink-900">Our Values</h2>
          <ul className="mt-4 space-y-2 leading-relaxed">
            <li><strong className="text-ink-900">Community First</strong> – People over profit</li>
            <li><strong className="text-ink-900">Authenticity</strong> – Real homes, real food</li>
            <li><strong className="text-ink-900">Inclusion</strong> – Everyone is welcome</li>
            <li><strong className="text-ink-900">Trust & Transparency</strong> – No hidden surprises</li>
            <li><strong className="text-ink-900">Respect</strong> – For people, homes, and cultures</li>
          </ul>
        </section>

        <section id="join-community" className="rounded-lg border border-sand-200 bg-sand-50/50 p-6">
          <h2 className="text-2xl font-semibold text-ink-900">Join the Community</h2>
          <p className="mt-3 leading-relaxed">
            Whether you love hosting or discovering new dining experiences, DineAtHomeSocial welcomes you.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/host"
              className="shine rounded-full bg-gradient-to-r from-coral-500 via-violet-500 to-sky-500 px-6 py-3 text-center text-sm font-medium text-white shadow-soft hover:shadow-card"
            >
              👉 Become a Host
            </Link>
            <Link
              to="/events"
              className="rounded-full border border-sand-300 bg-white px-6 py-3 text-center text-sm font-medium text-ink-900 hover:bg-sand-100"
            >
              👉 Explore Meals
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-ink-600">
            👉 Connect Offline Through Food
          </p>
        </section>
      </div>
    </article>
  );
}
