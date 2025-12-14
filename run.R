library(shiny)

# Load environment variables if .env exists
if (file.exists(".env")) {
  library(dotenv)
  load_dot_env()
  cat("Loaded .env file for local development\n")
} else {
  cat("Using system environment variables (production)\n")
}

options(shiny.autoreload = TRUE)

# Source server
source("R/server.R")

# Create UI
ui <- htmlTemplate(
  "app/index.html",
  header = uiOutput("header"),
  sidebar = uiOutput("sidebar"),
  dashboard = uiOutput("dashboard"),
  sales_agents = uiOutput("sales_agents"),
  product_performance = uiOutput("product_performance"),
  sales_forecast = uiOutput("sales_forecast"),
  data_page = uiOutput("data_page"),
  documentation = uiOutput("documentation")
)

# Get port
port <- as.numeric(Sys.getenv("PORT", "5000"))
cat("Starting Northwind Traders Dashboard on port:", port, "\n")

# Run app
shinyApp(
  ui = ui,
  server = server,
  options = list(
    host = "0.0.0.0",
    port = port
  )
)