(ns esci.app
  (:require [sci.core :as sci]))

(defn ^:export init []
  (println "Hello from ClojureScript!")
  (js/console.log "Application initialized"))

(defn ^:export execute [code context]
  (try
    (let [ctx-map (js->clj context :keywordize-keys true)
          options {:namespaces {'user ctx-map}}
          result (sci/eval-string code options)]
      result)
    (catch js/Error e
      (js/console.error "Execution error:" e)
      nil)))

