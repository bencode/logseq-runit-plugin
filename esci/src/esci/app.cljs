(ns esci.app)

;; Entry point for the application
(defn ^:export init []
  (println "Hello from ClojureScript!")
  (js/console.log "Application initialized"))

;; Initialize the app when the page loads
(defn ^:export main []
  (init))

