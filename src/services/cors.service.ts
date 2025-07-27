import CORS_CONFIG from "../config/cors.config"
import cors from "cors"

const corsService = cors(CORS_CONFIG)

export default corsService
