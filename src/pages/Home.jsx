// src/pages/Home.jsx
import Image from "next/image";
import React from 'react';
<Image src="/scend-logo.png" alt="Scend Logo" width={100} height={100} />

function Home() {
  return (
    <div className="text-center mt-10">
      <div className="flex justify-center items-center space-x-4 mb-6">
        <img src={logo} alt="Scend Logo" className="h-12" />
        <h1 className="text-4xl font-bold text-pink-600">Welcome to Scend</h1>
      </div>
      <p className="text-lg">Your smart loan qualification tool powered by South African intelligence.</p>
    </div>
  );
}

export default Home;
