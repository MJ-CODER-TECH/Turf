import React from "react";
import Footer from "../components/Footer/Footer";

const AboutPage = () => {
  const stats = [
    { id: 1, number: "100+", label: "Turfs" },
    { id: 2, number: "6+", label: "Sports" },
    { id: 3, number: "15+", label: "Cities" },
    { id: 4, number: "10k+", label: "Players" },
  ];

  const values = [
    { id: 1, icon: "🤝", title: "Community First", description: "We believe sports bring people together. Our platform is built to foster connections through every match, every game." },
    { id: 2, icon: "✅", title: "Quality Turfs", description: "Every turf in our network is vetted for quality, safety, and the best playing experience possible." },
    { id: 3, icon: "🌍", title: "Accessible to All", description: "From beginners to pros, we make booking and playing sports easy, affordable, and accessible for everyone." },
  ];

  const team = [
    { id: 1, name: "Alex Rivera", role: "Founder & CEO", bio: "Former athlete with a passion for making sports accessible to every community." },
    { id: 2, name: "Priya Sharma", role: "Head of Operations", bio: "Ensuring every turf experience is seamless, safe, and top-notch." },
    { id: 3, name: "Marcus Chen", role: "Community Lead", bio: "Building bridges between players, venues, and local sports communities." },
    { id: 4, name: "Neha Gupta", role: "Product Manager", bio: "Designing experiences that make booking and playing effortless." },
  ];

  return (
    <div className="min-h-screen dark:bg-[#0a1628] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="mb-14">
          <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">✦ Who We Are</span>
          <h1 className="dark:text-white text-gray-900 text-4xl font-extrabold mt-2 mb-3">
            About <span className="dark:text-green-400 text-green-600">Us</span>
          </h1>
          <div className="w-14 h-1 rounded-full bg-gradient-to-r from-green-400 to-green-600 mb-4" />
          <p className="dark:text-slate-400 text-slate-500 text-lg max-w-3xl leading-relaxed">
            We're on a mission to connect players with the best turfs — from football to badminton, we've got every sport covered.
          </p>
        </div>

        {/* Story */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mb-5">Our <span className="dark:text-green-400 text-green-600">Story</span></h2>
            <p className="dark:text-slate-400 text-slate-500 mb-4 leading-relaxed">
              It started with a simple problem: finding a good turf to play football with friends was harder than it should be. We realized players across every sport faced the same challenge — scattered information, inconsistent quality, and complicated booking.
            </p>
            <p className="dark:text-slate-400 text-slate-500 mb-4 leading-relaxed">
              So we built a platform that brings together the best turfs across all cities. From cricket to basketball, tennis to badminton, we curate every venue so you can focus on the game.
            </p>
            <p className="dark:text-slate-400 text-slate-500 leading-relaxed">
              Today, we're proud to connect thousands of players with top-quality turfs every month. And we're just getting started.
            </p>
          </div>
          <div className="dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-8 flex items-center justify-center shadow-sm">
            <div className="text-center">
              <span className="text-6xl block mb-4">🏟️</span>
              <h3 className="dark:text-white text-gray-900 text-xl font-extrabold">Play More. Book Less.</h3>
              <p className="dark:text-slate-400 text-slate-500 mt-2">Your game, your turf, your moment.</p>
              <div className="w-10 h-1 rounded-full bg-green-500 mx-auto mt-4" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">📊 Numbers</span>
            <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-2">By the <span className="dark:text-green-400 text-green-600">Numbers</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {stats.map((stat) => (
              <div key={stat.id} className="group dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 text-center hover:border-green-500 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300">
                <p className="dark:text-green-400 text-green-600 text-3xl font-extrabold mb-1">{stat.number}</p>
                <p className="dark:text-slate-400 text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">💡 Values</span>
          <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-2 mb-8">What We <span className="dark:text-green-400 text-green-600">Stand For</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value) => (
              <div key={value.id} className="group dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 hover:border-green-500 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300">
                <div className="w-12 h-12 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:border-green-500 transition-colors duration-300">
                  {value.icon}
                </div>
                <div className="w-8 h-0.5 bg-green-500 rounded-full mb-3" />
                <h3 className="dark:text-white text-gray-900 font-bold text-lg mb-2 dark:group-hover:text-green-400 group-hover:text-green-600 transition-colors duration-200">{value.title}</h3>
                <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-14">
          <span className="dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">👥 People</span>
          <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mt-2 mb-8">Meet the <span className="dark:text-green-400 text-green-600">Team</span></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.id} className="group dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border rounded-xl p-6 text-center hover:border-green-500 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300">
                <div className="w-16 h-16 dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-full mx-auto mb-4 flex items-center justify-center text-2xl group-hover:border-green-500 transition-colors duration-300">
                  👤
                </div>
                <h3 className="dark:text-white text-gray-900 font-bold dark:group-hover:text-green-400 group-hover:text-green-600 transition-colors duration-200">{member.name}</h3>
                <p className="dark:text-green-400 text-green-600 text-xs font-semibold mb-2">{member.role}</p>
                <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="dark:bg-[#0d1f3c] bg-white dark:border-green-500/30 border-green-500/40 border rounded-xl p-10 text-center dark:shadow-[0_0_40px_rgba(34,197,94,0.08)] shadow-[0_0_40px_rgba(34,197,94,0.05)]">
          <h2 className="dark:text-white text-gray-900 text-2xl font-extrabold mb-2">Ready to <span className="dark:text-green-400 text-green-600">Play?</span></h2>
          <p className="dark:text-slate-400 text-slate-500 mb-6 max-w-xl mx-auto">Find your perfect turf and book your next game in minutes.</p>
          <button className="px-8 py-3 bg-green-500 dark:text-[#0a1628] text-white font-extrabold rounded-xl hover:bg-green-400 transition-colors duration-200">
            Browse Turfs →
          </button>
        </div>

        <div className="mt-8 text-xs dark:text-slate-600 text-slate-400 dark:border-[#1a3a5c] border-gray-200 border-t pt-4 text-center">
          every sport — every turf — every player
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;