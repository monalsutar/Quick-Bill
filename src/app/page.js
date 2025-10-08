"use client"; 

import axios from "axios";
import { useState } from "react";
import "./globals.css";

export default function Home() {

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  const handleSubmit = async(e) => {
      // e.preventDefault()
      try{

        const response = await axios.post('/api/users', {email, pass})
        alert("Register Sucessful...")

      }catch(e){

        alert("Fail")
        console.log(e)
      }
  }


  return (
    <div className = "conatiner">
      <h3>Hey Register to my Next JS</h3>

      <div>

      
      <form onSubmit={handleSubmit}  className="login-form">

        <input type="email" placeholder="Enter Email "
            onChange={(e) => setEmail(e.target.value)}
            required
        ></input>


        <input type="password" placeholder="Enter Password "
             onChange={(e) => setPass(e.target.value)}
              required
        
        ></input>


        <button>Submit</button>

      </form>

      </div>
    </div>
  );
}
