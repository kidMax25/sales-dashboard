# R/modules/filters.R
# ============================================
# FILTERS MODULE - Namespaced with moduleServer
# ============================================

library(shiny)
library(tidyverse)
library(jsonlite)  # for potential extensions
`%||%` <- function(a, b) if (!is.null(a)) a else b

source("data/database_operations.R")  # for get_data()

filtersServer <- function(id, base_data = NULL) {
  moduleServer(id, function(input, output, session) {
    
    # If no base_data passed, load it inside (cached reactively)
    sales_data_full <- reactive({
      if (is.null(base_data)) {
        req(get_data())  # from database_operations.R
      } else {
        req(base_data())
      }
    })
    
    # ============================================
    # EXTRACT FILTER OPTIONS (sent to JS once)
    # ============================================
    filter_options <- reactive({
      data <- sales_data_full()
      
      if (is.null(data) || nrow(data) == 0) return(NULL)
      
      agents <- data %>%
        distinct(`Employee ID`, `First Name`, `Last Name`) %>%
        filter(!is.na(`Employee ID`), !is.na(`First Name`), !is.na(`Last Name`)) %>%
        mutate(
          value = as.character(`Employee ID`),
          label = paste(`First Name`, `Last Name`)
        ) %>%
        arrange(label) %>%
        select(value, label)
      
      regions <- data %>%
        distinct(`Ship City`) %>%
        filter(!is.na(`Ship City`), `Ship City` != "") %>%
        rename(value = `Ship City`) %>%
        mutate(label = value) %>%
        arrange(value)
      
      categories <- data %>%
        distinct(Category) %>%
        filter(!is.na(Category), Category != "") %>%
        rename(value = Category) %>%
        mutate(label = value) %>%
        arrange(value)
      
      date_range <- list(
        min_date = as.character(min(data$`Order Date`, na.rm = TRUE)),
        max_date = as.character(max(data$`Order Date`, na.rm = TRUE))
      )
      
      list(
        agents = agents,
        regions = regions,
        categories = categories,
        date_range = date_range
      )
    })
    
    # Send options to JS on module init/change
    session$onFlushed(function() {
      isolate({
        opts <- filter_options()
        if (!is.null(opts)) {
          session$sendCustomMessage("filter_options", opts)
        }
      })
    }, once = TRUE)
    
    # ============================================
    # REACTIVE FILTER STATE
    # ============================================
    filters <- reactiveValues(
      start_date = NULL,
      end_date = NULL,
      agent = NULL,
      region = NULL,
      category = NULL,
      is_filtered = FALSE,
      last_updated = Sys.time()
    )
    
    # Update from JS input$dashboard_filters
    observeEvent(input$dashboard_filters, {
      req(input$dashboard_filters)
      f <- input$dashboard_filters
      
      filters$start_date <- f$startDate %||% NULL
      filters$end_date   <- f$endDate %||% NULL
      filters$agent      <- f$agent %||% NULL
      filters$region     <- f$region %||% NULL
      filters$category   <- f$category %||% NULL
      
      filters$is_filtered <- any(nzchar(c(f$startDate, f$endDate, f$agent, f$region, f$category)))
      filters$last_updated <- Sys.time()
    })
    
    # Reset from JS
    observeEvent(input$filters_reset, {
      filters$start_date <- NULL
      filters$end_date   <- NULL
      filters$agent      <- NULL
      filters$region     <- NULL
      filters$category   <- NULL
      filters$is_filtered <- FALSE
      filters$last_updated <- Sys.time()
    })
    
    # ============================================
    # APPLY FILTERS TO DATA
    # ============================================
    filtered_data <- reactive({
      data <- sales_data_full()
      if (is.null(data)) return(NULL)
      
      if (!is.null(filters$start_date) && nzchar(filters$start_date)) {
        data <- data %>% filter(`Order Date` >= as.Date(filters$start_date))
      }
      if (!is.null(filters$end_date) && nzchar(filters$end_date)) {
        data <- data %>% filter(`Order Date` <= as.Date(filters$end_date))
      }
      if (!is.null(filters$agent) && nzchar(filters$agent)) {
        data <- data %>% filter(`Employee ID` == as.numeric(filters$agent))
      }
      if (!is.null(filters$region) && nzchar(filters$region)) {
        data <- data %>% filter(`Ship City` == filters$region)
      }
      if (!is.null(filters$category) && nzchar(filters$category)) {
        data <- data %>% filter(Category == filters$category)
      }
      
      data
    })
    
    # Optional: Send current state back to JS for sync/debug
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
    
    # Return what other modules/server need
    list(
      filtered_data = filtered_data,
      full_data = sales_data_full,
      options = filter_options,
      state = reactive(filters)  # if needed elsewhere
    )
  })
}