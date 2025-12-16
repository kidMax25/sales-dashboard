library(shiny)
library(jsonlite)

# Load modules
source("R/modules/filters.R")
source("R/modules/kpis.R")
source("data/database_operations.R")

server <- function(input, output, session) {
  
  
  base_sales_data <- reactive({
    cat("Loading base sales data...\n")
    showNotification("Data Loaded Succefully", type = "message", closeButton = FALSE)
    get_data()
  })
  
  filters_mod <- filtersServer("filters_mod", base_data = base_sales_data)
  
  observe({
    kpis <- calculate_kpis(filters_mod$filtered_data())
    session$sendCustomMessage("updated_kpis", kpis)
  })
  
  output$filters <- renderUI({
    tags$div(id = "filters-root")
  })
  
  # Render Header
  output$header <- renderUI({
    includeHTML("app/components/header.html")
  })
  
  # Render Sidebar
  output$sidebar <- renderUI({
    includeHTML("app/components/sidebar.html")
  })
  
  # Render Dashboard Page
  output$dashboard <- renderUI({
    cat("Rendering dashboard page\n")
    includeHTML("app/dashboard.html")
  })
  
  # Render Sales Agents Page
  output$sales_agents <- renderUI({
    cat("Rendering sales agents page\n")
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Sales Agents"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Sales Agents page - Coming soon...")
      )
    )
  })
  
  # Render Product Performance Page
  output$product_performance <- renderUI({
    cat("Rendering product performance page\n")
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Product Performance"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Product Performance page - Coming soon...")
      )
    )
  })
  
  # Render Sales Forecast Page
  output$sales_forecast <- renderUI({
    cat("Rendering sales forecast page\n")
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Sales Forecast"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Sales Forecast page - Coming soon...")
      )
    )
  })
  
  # Render Data Page
  output$data_page <- renderUI({
    cat("Rendering data page\n")
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Data"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Data page - Coming soon...")
      )
    )
  })
  
  # Render Documentation Page
  output$documentation <- renderUI({
    cat("Rendering documentation page\n")
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Documentation"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Documentation page - Coming soon...")
      )
    )
  })
  

  
}