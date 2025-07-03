import rateLimiterService from "./rate-limiter"
import corsService from "./cors"
import helmetService from "./helmet"

const services = [rateLimiterService, corsService, helmetService]

export default services
