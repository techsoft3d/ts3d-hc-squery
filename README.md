# Advanced Search for HOOPS Communicator

## Version Update (1.1.2)
* renamed to SmartSearch

## Version Update (1.1.0)
* UI included in main library
* Many other improvements and fixes

## Version Update (1.0.0)
* Support for picking categories
* Many other improvements and fixes

## Version Update (0.9.9)
* Support for secondary quantity in results

## Version Update (0.9.8)
* Support for property view in results
* Auto Color option

## Version Update (0.9.5)
* Bounding search
* Various UI improvements

## Version Update (0.9.2)
* Support for aggregate related property
* ensure search does not stall viewer
* indicator when search is running

## Version Update (0.9.0)
* More flexible related property search
* Ability to search directly for IFC Globalid
* Various other improvements and fixes

## Version Update (0.8.6)
* Ability to specify & execute Query Actions

## Version Update (0.8.4)
* Callback for search results

## Version Update (0.8.3)
* Ability to search by node children (count and name)
* Display of property stats (nummber of options, number of occurences) in editor
* Various other improvements and fixes

## Version Update (0.7.7)
* Ability to search Dates
* Ability to search past found nodes
* Better Ui Styling

## Version Update (0.7.4)
* Ability to pass property file during initialization
* Server-Side generation of property file

## Version Update (0.6.1)
* Ability to save/restore optimized property JSON

## Version Update (0.6.0)
* Tabulator now included in UI library

## Version Update (0.5.3)
* Ability to choose an existing query as a filter condition

## Version Update (0.5.0) 
* Abiltity to hide top row UI buttons
* Update to HOOPS Communicator 2023 U1

## Overview
![alt text](https://github.com/techsoft3d/ts3d-hc-smartsearch/blob/master/readme_images/image1.png?raw=true)  
This library provides advanced search capabilities for HOOPS Communicator. It is split into the two main components, the core search and filter functionality as well as an UI component utilizing those classes.

For questions/feedback please send an email to guido@techsoft3d.com or post in our [forum](https://forum.techsoft3d.com/). For a 60 day trial of the HOOPS Web Platform go to [Web Platform](https://www.techsoft3d.com/products/hoops/web-platform).

## Future Plans
* various performance improvements
* server-side Search Evaluation
* More UI Customization Options
* More robust date parsing
* Improved Documentation

## Install
Add `dist/hcSmartSearch.min.js` to your project 
```
    <script src="./js/hcSmartSearch.min.js"></script>
```

If you are using the UI component of the library you also need to include the tabulator library (tested with version 5.4.4) and add `dist/hcSmartSearchUI.css` to your project which contains a custom tabulator theme.
```
    <script type="text/javascript" src="https://unpkg.com/tabulator-tables@5.4.4/dist/js/tabulator.min.js"></script>
    <link rel="stylesheet" href="./css/hcSmartSearchUI.css">
```

## Demo

Here is how to start the demo with the provided sample model locally when using the Visual Studio Code Live Server plugin:

<http://127.0.0.1:5500/dev/viewer.html?scs=models/arboleda.scs>


## Search Editor UI 
## Initialization

```
let manager = new hcSmartSearch.SmartSearchManager(hwv);
hcSmartSearch.SmartSearchEditorUI.initialize("searcheditor", manager);
hcSmartSearch.SmartSearchEditorUI.display();
```
Initializes the Editor UI and displays it. The first parameter is the id of the div that the UI should be created in. The second parameter is the webviewer object. A third (optional) parameter is the startnode. It is the node from which the search will be performed.

Before the search window is initially displayed all model properties are extracted and put into an internal hash. That can take a few seconds for large models.

The editor is reactive and will adjust to various sizes though the parent div should be at least 300px wide and 400px high. Through the separate CSS file you can modify some aspect of its styling but if you need more customization I suggest delving into the source code.

## Usage

 The functionality of this class should be largely self-explanatory. The user can combine multiple conditions with either an “and” or “or” operator (but not mixed). However the user can also add a single level of subfilters with a separate set of conditions for more flexibility. 
 
 In addition the user can limit the scope of future searches by activating the “Limit to Selection:” checkbox which will limit all future searches to the currently selected nodes and their children.

### "contains" Comparison

When searching for text with “contains” the default is a non case-sensitive substring search so a search for “Screw” will find “front screw” as well as “back screw”. If you need a precise search, surround the search string in double quotes. To find all nodes that do not have the search string put a “-“ in front of the search term. It is also possible to combine multiple text searches by putting a “,” between them. In this case you can put a + in front of the search term to require that the search term is present.

**Example "contains" Searches:**  

*Type contains wall,door*  
This will find all elements where the name of the type contains either wall or door.

*Type contains wall,-curtainwall*  
This will find all elements where the name of the type contains wall but not curtainwall.

*Node Name contains +IFC,wall,door*  
This will find all elements where the name contains IFC and either wall or door.

*Type contains "IFCWALL"*  
This will find all elements where the name of the type is exactly “IFCWALL”

### Other Comparisons

You can also search for the existence (or absence) of a specific property. In addition if the property has a numeric value you can also perform number comparisons. In the current implementation units are ignored and it is assumed that all nodes share the same unit for this property.

### Properties

**Nodeid Property**  
Performs the search on specific nodeids (separated by comma).

**Node Chain Property**  
“Node Chain” performs the text search on the complete path to a node. Its an easy way to filter the search by a certain floor in a building for example.

**Node Parent Property**  
“Node Parent” performs the text search on the name of the parent node

**Node Type Property**  
Performs the search on the HOOPS Communicator internal type of the node (the value returned by model.getNodeType())

**Node Color Property**  
Performs the search on the color of a node specified as 3 RGB integers (e.g. “255 0 0”). If selecting a node the color of that node will be a preset option. It's important to keep in mind that in HOOPS Communicator colors only exist on body (leaf) nodes in the product tree.

**Rel: Space Boundary Property**  
If this option is selected the search will be performed on the relating SpaceBoundary elements of the nodes with the specified text. 

*Rel:SpaceBoundary contains kitchen*  
This will find all elements that are related to all IFCSPACE's which contain kitchen in their name.

**Rel: Contained Property**  
If this option is selected the search will be performed on the elements "contained in" the nodes with the specified text.

**SmartSearch**  
If this option is selected the search will be performed on the specified Query


### Advanced Usage:

```
 hcSmartSearch.SmartSearchEditorUI.setChainSkip(1);
```
When displaying the search results you can optionally skip over the first "n" levels when displaying the parent hierachy of a node. This is useful if the application uses the loadSubtree functionality to load a model into a node other than the root node.


```
 hcSmartSearch.SmartSearchEditorUI.setShowLimitOption(true);
```
Controls if the Limit checkbox should be visible in the UI.

## SmartSearchManager UI
### Initialization

```
    hcSmartSearch.SmartSearchManagerUI.initialize("searchmanagercontainer",manager, true);
```

Initializes the Manager UI and displays it. The first parameter is the id of the div that the UI should be created in. The second parameter is the webviewer object. If the third parameter is set to true the import/export buttons will be visible in the UI. 


### Usage

This class keeps track of a list of queries that can be applied to a model. The user can add a new query by pressing the add button which adds the current editor search to the query list.

After a search has been added it can be executed via the "Select" button which will highlight all found nodes and update the search editor window (hold down shift to isolate the nodes instead). The user can also edit the generated text describing the search, update the filter from the current editor search or delete the filter from the list. The final column in the list indicates if the filter should become a  property. See below for more information on this functionality.
  
With the optional Load/Export buttons the user can load and save the current list of queries to a JSON file.


### Advanced Usage:

A callback function can be provided that gets triggered on any change of the list of squeries. In the callback the list of queries can then be retrieved from the SmartSearchManager object and further processed (pushed to a server, etc.). See example below:
```
    hcSmartSearch.SmartSearchManagerUI.setUpdatedCallback(searchupdated);        
    async function searchupdated() {
        let text = JSON.stringify({filtersarray:hcSmartSearch.SmartSearchManager.toJSON()});

        var res = await fetch(serveraddress + '/api/smartsearches', {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
            'Content-Type': 'application/json'      
            },
            body: text
        });

}
```

The JSON object representing a list of squeries can be added to the SmartSearchManager with the code below:

```
    hcSmartSearch.SmartSearchManager.fromJSON(data.filtersarray);
    hcSmartSearch.SmartSearchManagerUI.refreshUI();
```



## SmartSearchProperties UI
### Initialization


```
  hcSmartSearch.SmartSearchPropertiesUI.initialize("spropertiescontainer",manager);
```


Initializes the SmartSearchProperties UI and displays it. The first parameter is the id of the div that the UI should be created in. The second parameter is the webviewer object. 


### Usage

The SmartSearch Manager UI can turn a query into a property which means that it will be evaluated whenever the user selects an object in the webviewer. It basically becomes a dynamic user defined property. 


## Performance and handling of Federated Models
In order to ensure fast client-side search performance, the SmartSearch library generates an acceleration structure for the loaded model during initialization. This can take a few seconds for large models. The structure also needs to be regenerated whenever a new model is added to the scene. To improve the performance for this workflow it is possible to provide the startnode of the newly loaded model as well as a unique identifier (e.g. the name of the model) to the SmartSearch after the model has been loaded (make sure that the provided nodeid is part of the new model, in most cases this will be the child node of the node the model has been loaded into).

```
  hcSmartSearch.SmartSearch.addModel("arboleda",nodeid);
```

When calling this function whenever a new model is added to the webviewer the acceleration structure only has to be generated for the newly added model and not the already existing models which  significantly improves initialization performance.

## Disclaimer
**This library is not an officially supported part of HOOPS Communicator and provided as-is.**

## Acknowledgments
### Demo:
* [GoldenLayout](https://golden-layout.com/)

### SmartSearch UI:
* [Tabulator](http://tabulator.info/)