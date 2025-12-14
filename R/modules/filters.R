# ============================================
# FILTER MODULE - Global Reactive Filters
# ============================================
# This module handles all filter operations globally
# No namespacing - single source of truth for filters

library(shiny)
library(tidyverse)

# Load data operations
source("data/database_operations.R")

# ============================================
# GET FILTER OPTIONS
# ============================================
# This function extracts unique values from the data
# for populating filter dropdowns

get_filter_options <- function() {
  tryCatch({
    # Get sales data
    sales_data <- get_data()
    
    if (is.null(sales_data) || nrow(sales_data) == 0) {
      return(NULL)
    }
    
    # Extract unique values for filters
    options <- list(
      agents = sales_data %>%
        distinct(`Employee ID`, `First Name`, `Last Name`) %>%
        filter(!is.na(`Employee ID`)) %>%
        mutate(full_name = paste(`First Name`, `Last Name`)) %>%
        arrange(full_name),
      
      regions = sales_data %>%
        distinct(`Ship Country/Region`) %>%
        filter(!is.na(`Ship Country/Region`)) %>%
        arrange(`Ship Country/Region`),
      
      categories = sales_data %>%
        distinct(Category) %>%
        filter(!is.na(Category)) %>%
        arrange(Category),
      
      date_range = list(
        min_date = min(sales_data$`Order Date`, na.rm = TRUE),
        max_date = max(sales_data$`Order Date`, na.rm = TRUE)
      )
    )
    
    return(options)
    
  }, error = function(e) {
    cat("Error getting filter options:", e$message, "\n")
    return(NULL)
  })
}

# ============================================
# REACTIVE FILTER VALUES
# ============================================
# Creates reactive values that hold current filter state

create_filter_reactives <- function() {
  reactiveValues(
    start_date = NULL,
    end_date = NULL,
    agent = NULL,
    region = NULL,
    category = NULL,
    is_filtered = FALSE
  )
}

# ============================================
# UPDATE FILTERS FROM INPUT
# ============================================
# Updates reactive values when inputs change

update_filters <- function(filters, input) {
  filters$start_date <- input$start_date
  filters$end_date <- input$end_date
  filters$agent <- input$agent_filter
  filters$region <- input$region_filter
  filters$category <- input$category_filter
  
  # Check if any filter is active
  filters$is_filtered <- !is.null(filters$start_date) || 
    !is.null(filters$end_date) ||
    !is.null(filters$agent) || 
    !is.null(filters$region) || 
    !is.null(filters$category)
  
  cat("=== Filters Updated ===\n")
  cat("Start Date:", filters$start_date, "\n")
  cat("End Date:", filters$end_date, "\n")
  cat("Agent:", filters$agent, "\n")
  cat("Region:", filters$region, "\n")
  cat("Category:", filters$category, "\n")
  cat("Is Filtered:", filters$is_filtered, "\n")
}

# ============================================
# RESET FILTERS
# ============================================
# Resets all filter values to NULL

reset_filters <- function(filters, session) {
  filters$start_date <- NULL
  filters$end_date <- NULL
  filters$agent <- NULL
  filters$region <- NULL
  filters$category <- NULL
  filters$is_filtered <- FALSE
  
  # Reset UI inputs
  updateDateInput(session, "start_date", value = NA)
  updateDateInput(session, "end_date", value = NA)
  updateSelectInput(session, "agent_filter", selected = "")
  updateSelectInput(session, "region_filter", selected = "")
  updateSelectInput(session, "category_filter", selected = "")
  
  cat("Filters reset\n")
}

# ============================================
# APPLY FILTERS TO DATA
# ============================================
# Filters the sales data based on current filter values

apply_filters_to_data <- function(sales_data, filters) {
  
  if (is.null(sales_data) || nrow(sales_data) == 0) {
    return(NULL)
  }
  
  filtered_data <- sales_data
  
  # Apply date range filter
  if (!is.null(filters$start_date) && !is.na(filters$start_date)) {
    filtered_data <- filtered_data %>%
      filter(`Order Date` >= filters$start_date)
  }
  
  if (!is.null(filters$end_date) && !is.na(filters$end_date)) {
    filtered_data <- filtered_data %>%
      filter(`Order Date` <= filters$end_date)
  }
  
  # Apply agent filter
  if (!is.null(filters$agent) && filters$agent != "") {
    filtered_data <- filtered_data %>%
      filter(`Employee ID` == filters$agent)
  }
  
  # Apply region filter
  if (!is.null(filters$region) && filters$region != "") {
    filtered_data <- filtered_data %>%
      filter(`Ship Country/Region` == filters$region)
  }
  
  # Apply category filter
  if (!is.null(filters$category) && filters$category != "") {
    filtered_data <- filtered_data %>%
      filter(Category == filters$category)
  }
  
  cat("Data filtered: ", nrow(filtered_data), " rows remaining\n")
  
  return(filtered_data)
}

# ============================================
# RENDER FILTER UI DYNAMICALLY
# ============================================
# Renders the filter UI with dynamic options from data

render_filter_ui <- function(output) {
  output$filter_ui <- renderUI({
    
    # Get filter options from data
    options <- get_filter_options()
    
    if (is.null(options)) {
      return(tags$div(
        class = "text-red-600 text-sm",
        "Error loading filter options"
      ))
    }
    
    # Build agent choices
    agent_choices <- setNames(
      c("", options$agents$`Employee ID`),
      c("All Agents", options$agents$full_name)
    )
    
    # Build region choices
    region_choices <- c("All Regions", options$regions$`Ship Country/Region`)
    names(region_choices) <- region_choices
    region_choices["All Regions"] <- ""
    
    # Build category choices
    category_choices <- c("All Categories", options$categories$Category)
    names(category_choices) <- category_choices
    category_choices["All Categories"] <- ""
    
    tags$div(
      class = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-2",
      
      # Date Range
      tags$div(
        tags$label(
          class = "block text-xs font-medium text-gray-500 uppercase tracking-wider",
          "Date Range"
        ),
        tags$div(
          class = "flex space-x-4",
          tags$div(
            class = "w-1/2",
            dateInput(
              "start_date",
              label = NULL,
              value = NULL,
              min = options$date_range$min_date,
              max = options$date_range$max_date
            )
          ),
          tags$div(
            class = "w-1/2",
            dateInput(
              "end_date",
              label = NULL,
              value = NULL,
              min = options$date_range$min_date,
              max = options$date_range$max_date
            )
          )
        )
      ),
      
      # Sales Agent
      tags$div(
        tags$label(
          class = "block text-xs font-medium text-gray-500 uppercase tracking-wider",
          `for` = "agent_filter",
          "Sales Agent"
        ),
        selectInput(
          "agent_filter",
          label = NULL,
          choices = agent_choices,
          selected = ""
        )
      ),
      
      # Region
      tags$div(
        tags$label(
          class = "block text-xs font-medium text-gray-500 uppercase tracking-wider",
          `for` = "region_filter",
          "Region"
        ),
        selectInput(
          "region_filter",
          label = NULL,
          choices = region_choices,
          selected = ""
        )
      ),
      
      # Category
      tags$div(
        tags$label(
          class = "block text-xs font-medium text-gray-500 uppercase tracking-wider",
          `for` = "category_filter",
          "Product Category"
        ),
        selectInput(
          "category_filter",
          label = NULL,
          choices = category_choices,
          selected = ""
        )
      )
    )
  })
}