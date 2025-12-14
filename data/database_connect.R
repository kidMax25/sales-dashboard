database_connect <- function() {
  database_path <- "data//northwind_traders.accdb"
  tables <- c("Orders","Order Details","Products","Employees",
              "Customers","Shippers","Suppliers")
  
  if (!file.exists("data//data.rds")) {
    channel <- odbcDriverConnect(
      paste0("Driver={Microsoft Access Driver (*.mdb, *.accdb)};",
             "DBQ=", database_path)
    )
    on.exit(close(channel))
    
    northwind <- list()
    
    for (tbl in tables) {
      cat("Extracting", tbl, "...\n")
      result <- tryCatch({
        sqlQuery(channel, paste0("SELECT * FROM [", tbl , "]"))
      }, error = function(e){
        cat("Failed to load", tbl, ":", e$message, "\n")
        NULL
      })
      
      if (!is.null(result) && nrow(result) > 0) {
        northwind[[tbl]] <- result
        cat("   Success (", nrow(result), " rows)\n")
      } else {
        cat("   Skipped (empty or error)\n")
      }
    }
    
    if (length(northwind) > 0) {
      saveRDS(northwind, "data//data.rds")
      cat("Data extracted and saved successfully\n")
    } else {
      cat("Operation failed, no tables saved\n")
    }
  } else {
    cat("Existing data.rds found, skipping extraction\n")
  }
}
