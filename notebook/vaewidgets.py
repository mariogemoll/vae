from IPython.display import HTML

def dataset_explanation():
    """
    Display the dataset explanation widget.
    """
    with open("widget-wrappers/dist/datasetexplanation.js") as js_file, \
         open("../widgets/html/datasetexplanation.html") as html_file:
        js = js_file.read()
        html = html_file.read()
    
    return HTML(f'''
    {html}
    <script>{js}</script>
    ''')
