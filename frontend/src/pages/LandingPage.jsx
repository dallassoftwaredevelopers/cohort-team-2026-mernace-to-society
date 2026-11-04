import "../App.css"
import { useNavigate } from "react-router-dom"


const LandingPage = () => {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Go Team MERNace to Society!!!!</h1>
      <h2>We absolutely got this!</h2>
      <br />
      
    <button onClick={() => navigate("/dashboard")} className="rounded-lg bg-purple-600 px-5 py-3 text-sm font-medium text-white hover:bg-black">
      Go To Dashboard
    </button>
    
      <div>
        <img
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWVhYXlmaWdyd2dqZTVob2tpaWJobmJjNWduaDI2NWJkOXJnaGs5aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KEYHVukD2C6xKcU2n6/giphy.gif"
          alt="we got this"></img>
        <br />
        <br />
        <img
          src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMm1mdzIweGxxdHZyY2Q4MjBybHZ2cmhnanNtdXFvdDh6cnRla3RuayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HErxXO3PkYJ7HIBmq4/giphy.gif"
          alt="we got this"></img>
      </div>
    </div>
  )
}

export default LandingPage
