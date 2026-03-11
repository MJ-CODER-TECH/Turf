import React from "react";

const AboutPage = () => {
  const stats = [
    { id: 1, number: "100+", label: "Turfs" },
    { id: 2, number: "6+", label: "Sports" },
    { id: 3, number: "15+", label: "Cities" },
    { id: 4, number: "10k+", label: "Players" },
  ];

  const values = [
    {
      id: 1,
      title: "Community First",
      description:
        "We believe sports bring people together. Our platform is built to foster connections through every match, every game.",
    },
    {
      id: 2,
      title: "Quality Turfs",
      description:
        "Every turf in our network is vetted for quality, safety, and the best playing experience possible.",
    },
    {
      id: 3,
      title: "Accessible to All",
      description:
        "From beginners to pros, we make booking and playing sports easy, affordable, and accessible for everyone.",
    },
  ];

  const team = [
    {
      id: 1,
      name: "Alex Rivera",
      role: "Founder & CEO",
      bio: "Former athlete with a passion for making sports accessible to every community.",
    },
    {
      id: 2,
      name: "Priya Sharma",
      role: "Head of Operations",
      bio: "Ensuring every turf experience is seamless, safe, and top-notch.",
    },
    {
      id: 3,
      name: "Marcus Chen",
      role: "Community Lead",
      bio: "Building bridges between players, venues, and local sports communities.",
    },
    {
      id: 4,
      name: "Neha Gupta",
      role: "Product Manager",
      bio: "Designing experiences that make booking and playing effortless.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 py-8 bg-white">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">About Us</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          We're on a mission to connect players with the best turfs — from
          football to badminton, we've got every sport covered.
        </p>
        <div className="w-20 h-1 bg-gray-800 mt-4"></div>
      </div>

      {/* Story Section */}
      <div className="grid md:grid-cols-2 gap-10 mb-16">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Our Story
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            It started with a simple problem: finding a good turf to play
            football with friends was harder than it should be. We realized
            players across every sport faced the same challenge — scattered
            information, inconsistent quality, and complicated booking.
          </p>
          <p className="text-gray-600 mb-4 leading-relaxed">
            So we built a platform that brings together the best turfs across
            all cities. From cricket to basketball, tennis to badminton, we
            curate every venue so you can focus on the game.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Today, we're proud to connect thousands of players with top-quality
            turfs every month. And we're just getting started.
          </p>
        </div>
        <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl block mb-4">🏟️</span>
            <h3 className="text-xl font-bold text-gray-800">Play More. Book Less.</h3>
            <p className="text-gray-600 mt-2">Your game, your turf, your moment.</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          By the Numbers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100"
            >
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stat.number}
              </p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          What We Stand For
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value) => (
            <div
              key={value.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {value.title}
              </h3>
              <p className="text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Meet the Team
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                👤
              </div>
              <h3 className="font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{member.role}</p>
              <p className="text-sm text-gray-600">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to play?</h2>
        <p className="text-gray-300 mb-5 max-w-2xl mx-auto">
          Find your perfect turf and book your next game in minutes.
        </p>
        <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Browse Turfs
        </button>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-xs text-gray-400 border-t border-gray-100 pt-4 text-center">
        <span>every sport — every turf — every player</span>
      </div>
    </div>
  );
};

export default AboutPage;