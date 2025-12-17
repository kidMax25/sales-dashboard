require(pacman, quietly = TRUE)

p_load(shiny, jsonlite, tidyverse)

# Load functions
source("R/modules/kpis.R")
source("data/database_operations.R")
source("R/modules/product_data.R")
source("R/modules/agents.R")

# Define the %||%
`%||%` <- function(a, b) if (!is.null(a)) a else b

server <- function(input, output, session) {
  
  
  base_sales_data <- reactive({
    cat("Loading base sales data...\n")
    showNotification("Loading data...", type = "message", duration = 3)
    data <- get_data()
    showNotification("Data loaded successfully!", type = "message", duration = 2)
    data
  })
  
 
  
  filter_options <- reactive({
    data <- base_sales_data()
    
    if (is.null(data) || nrow(data) == 0) return(NULL)
    
    cat("Extracting filter options...\n")
    
    # Extract agents - convert to list of named lists (row format)
    agents_df <- data %>%
      distinct(`Employee ID`, `First Name`, `Last Name`) %>%
      filter(!is.na(`Employee ID`), !is.na(`First Name`), !is.na(`Last Name`)) %>%
      mutate(
        value = as.character(`Employee ID`),
        label = paste(`First Name`, `Last Name`)
      ) %>%
      arrange(label) %>%
      select(value, label)
    
    # Convert to list of lists (row format for JS)
    agents_list <- lapply(1:nrow(agents_df), function(i) {
      list(
        value = agents_df$value[i],
        label = agents_df$label[i]
      )
    })
    
    # Extract regions - convert to list of named lists
    regions_df <- data %>%
      distinct(`Ship City`) %>%
      filter(!is.na(`Ship City`), `Ship City` != "") %>%
      rename(value = `Ship City`) %>%
      mutate(label = value) %>%
      arrange(value)
    
    regions_list <- lapply(1:nrow(regions_df), function(i) {
      list(
        value = regions_df$value[i],
        label = regions_df$label[i]
      )
    })
    
    # Extract categories - convert to list of named lists
    categories_df <- data %>%
      distinct(Category) %>%
      filter(!is.na(Category), Category != "") %>%
      rename(value = Category) %>%
      mutate(label = value) %>%
      arrange(value)
    
    categories_list <- lapply(1:nrow(categories_df), function(i) {
      list(
        value = categories_df$value[i],
        label = categories_df$label[i]
      )
    })
    
    date_range <- list(
      min_date = as.character(min(data$`Order Date`, na.rm = TRUE)),
      max_date = as.character(max(data$`Order Date`, na.rm = TRUE))
    )
    
    cat("Filter options extracted:\n")
    cat("  - Agents:", length(agents_list), "\n")
    cat("  - Cities:", length(regions_list), "\n")
    cat("  - Categories:", length(categories_list), "\n")
    
    # Return in JS-friendly format
    list(
      agents = agents_list,
      regions = regions_list,
      categories = categories_list,
      date_range = date_range
    )
  })
  
  observe({
    opts <- filter_options()
    if (!is.null(opts)) {
      # Use toJSON with auto_unbox to ensure proper structure
      session$sendCustomMessage("filter_options", opts)
      cat("✅ Filter options sent to JS\n")
      cat("Sample agent:", toJSON(opts$agents[[1]], auto_unbox = TRUE), "\n")
    }
  })
  
  
  filters <- reactiveValues(
    start_date = NULL,
    end_date = NULL,
    agent = NULL,
    region = NULL,
    category = NULL,
    is_filtered = FALSE,
    last_updated = Sys.time()
  )
  
  # Listen to dashboard_filters input (from custom binding)
  observeEvent(input$dashboard_filters, {
    req(input$dashboard_filters)
    f <- input$dashboard_filters
    
    cat("=== Filter Update from JS ===\n")
    cat("Start Date:", f$startDate, "\n")
    cat("End Date:", f$endDate, "\n")
    cat("Agent:", f$agent, "\n")
    cat("Region:", f$region, "\n")
    cat("Category:", f$category, "\n")
    
    filters$start_date <- if (!is.null(f$startDate) && nzchar(f$startDate)) f$startDate else NULL
    filters$end_date   <- if (!is.null(f$endDate) && nzchar(f$endDate)) f$endDate else NULL
    filters$agent      <- if (!is.null(f$agent) && nzchar(f$agent)) f$agent else NULL
    filters$region     <- if (!is.null(f$region) && nzchar(f$region)) f$region else NULL
    filters$category   <- if (!is.null(f$category) && nzchar(f$category)) f$category else NULL
    
    filters$is_filtered <- any(
      !is.null(filters$start_date),
      !is.null(filters$end_date),
      !is.null(filters$agent),
      !is.null(filters$region),
      !is.null(filters$category)
    )
    
    filters$last_updated <- Sys.time()
  })
  
  
  filtered_data <- reactive({
    data <- base_sales_data()
    if (is.null(data)) return(NULL)
    
    original_rows <- nrow(data)
    
    # Apply date filters
    if (!is.null(filters$start_date) && nzchar(filters$start_date)) {
      data <- data %>% filter(`Order Date` >= as.Date(filters$start_date))
      cat("After start_date filter:", nrow(data), "rows\n")
    }
    
    if (!is.null(filters$end_date) && nzchar(filters$end_date)) {
      data <- data %>% filter(`Order Date` <= as.Date(filters$end_date))
      cat("After end_date filter:", nrow(data), "rows\n")
    }
    
    # Apply agent filter
    if (!is.null(filters$agent) && nzchar(filters$agent)) {
      data <- data %>% filter(`Employee ID` == as.numeric(filters$agent))
      cat("After agent filter:", nrow(data), "rows\n")
    }
    
    # Apply region filter (Ship City)
    if (!is.null(filters$region) && nzchar(filters$region)) {
      data <- data %>% filter(`Ship City` == filters$region)
      cat("After region filter:", nrow(data), "rows\n")
    }
    
    # Apply category filter
    if (!is.null(filters$category) && nzchar(filters$category)) {
      data <- data %>% filter(Category == filters$category)
      cat("After category filter:", nrow(data), "rows\n")
    }
    
    cat("Data filtered:", original_rows, "->", nrow(data), "rows\n")
    
    data
  })

  
  observe({
    kpis <- calculate_kpis(filtered_data())
    session$sendCustomMessage("update_kpis", kpis)
    cat("KPIs sent to JS\n")
  })
  
  observe({
    product_data <- calculate_product_data(filtered_data())
    session$sendCustomMessage("product_data", product_data)
    cat("Product data sent to JS\n")
  })
  
  observe({
    agent_data <- calculate_agent_data(base_sales_data())
    session$sendCustomMessage("agent_data", agent_data)
    cat("Agent data sent to JS\n")
  })
  
  observe({
    state <- list(
      start_date = filters$start_date %||% "",
      end_date = filters$end_date %||% "",
      agent = filters$agent %||% "",
      region = filters$region %||% "",
      category = filters$category %||% "",
      is_filtered = filters$is_filtered,
      last_updated = format(filters$last_updated)
    )
    session$sendCustomMessage("filter_state", state)
  })
  
  # UI RENDERING
  
  output$header <- renderUI({
    includeHTML("app/components/header.html")
  })
  
  output$sidebar <- renderUI({
    includeHTML("app/components/sidebar.html")
  })
  
  output$dashboard <- renderUI({
    cat("Rendering dashboard page\n")
    includeHTML("app/dashboard.html")
  })
  
  output$sales_agents <- renderUI({
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Sales Agents"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Sales Agents page - Coming soon...")
      )
    )
  })
  
  output$product_performance <- renderUI({
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Product Performance"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Product Performance page - Coming soon...")
      )
    )
  })
  
  output$sales_forecast <- renderUI({
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Sales Forecast"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Sales Forecast page - Coming soon...")
      )
    )
  })
  
  output$data_page <- renderUI({
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Data"),
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Data page - Coming soon...")
      )
    )
  })
  
  output$documentation <- renderUI({
    tags$div(
      class = "max-w-7xl mx-auto",
      tags$h2(class = "text-3xl font-bold text-gray-800 mb-6", "Documentation"),
      tags$div(
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-8",
        tags$p(class = "text-gray-600", "Documentation page - Coming soon...")
      )
    )
  })
}