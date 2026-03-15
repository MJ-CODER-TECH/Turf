import React from 'react'
import Banner from '../components/Home/Banner'
import TurfList from '../components/Turf/TurfList'
import FeatureSection from '../components/Home/FeatureSection'
import Footer from '../components/Footer/Footer'

const Home = () => {
  return (
    <div className='w-full  h-screen '>
      <Banner/>
      <TurfList/>
      <FeatureSection/>
     
                  <Footer/>


    </div>
  )
}

export default Home
