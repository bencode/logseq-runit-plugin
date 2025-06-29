# logseq-runit-plugin

A Logseq plugin for running code snippets directly inside your notes.  
Supports JavaScript, Python (via [Pyodide](https://pyodide.org/)), and Scheme (via [BiwaScheme](https://www.biwascheme.org/)) with interactive output.  
Built for [Logseq](https://logseq.com/).

![Demo](images/p1.gif)

## Features

- **Multi-language support:** Run JavaScript, Python, and Scheme code blocks.
- **Console output capture:** See `console.log`/`print` output inline.
- **Last expression result:** Automatically displays the result of the last expression, similar to Jupyter notebooks.
- **Dynamic imports:** Supports dynamic module imports for JavaScript.
- **Easy insertion:** Use the `/Create Runit Snippet` slash command to insert runnable code blocks.

## Usage

1. Install the plugin in Logseq.
2. Use the `/Create Runit Snippet` command to insert a code block.
3. Write your code in JavaScript, Python, or Scheme inside the block.
4. The output and console logs will be displayed below the code.

### Importing External JavaScript Modules

You can import external JavaScript modules using the `$import` function:

```js
const R = await $import('https://esm.sh/ramda')

R.map(v => v + 1)([1, 2, 3, 4])

// output
Array [
  2,
  3,
  4,
  5,
]
```

The `$import` function supports both URLs and module names, allowing you to use libraries from CDNs like [esm.sh](https://esm.sh/) directly in your code snippets.

### Google Charts Integration

You can create interactive charts using Google Charts:

```js
const chart = await $import('google-charts')
const data = [
  ['Task', 'Hours per Day'],
  ['Work',     11],
  ['Eat',      2],
  ['Commute',  2],
  ['Watch TV', 2],
  ['Sleep',    7]
]
const options = {
  title: 'My Daily Activities',
  width: 500,
  height: 300
}
chart.render('PieChart', data, options)
```

The Google Charts integration supports various chart types including PieChart, BarChart, LineChart, ScatterChart, Gauge, GeoChart, and Table. Charts are rendered as interactive SVG elements directly in your notes.

For more chart types and configuration options, see the [Google Charts Gallery](https://developers.google.com/chart/interactive/docs/gallery/linechart).


### Scheme Support

The plugin supports running Scheme code snippets via BiwaScheme, allowing you to execute and view results conveniently in your notes:

**Recursive Function:**

(define (fib n)
  (if (< n 2) n
      (+ (fib (- n 1)) (fib (- n 2)))))
(fib 8)
```

These examples showcase Scheme's elegant syntax and functional programming capabilities within the runit environment.

## Development

- Clone the repo and run `pnpm install`.
- Use `pnpm dev` to start development with hot reload.
- Build for production with `pnpm build`.

## Acknowledgments

Special thanks to [Klipse](https://github.com/viebel/klipse) for inspiration.  
Originally, I wanted to integrate Klipse directly, but due to some technical limitations, I implemented a simplified "code runner" based on some of Klipse's ideas.  

**Note:**  
Currently, code execution happens when the code editor loses focus, which is less interactive compared to Klipse.  

## License

MIT
