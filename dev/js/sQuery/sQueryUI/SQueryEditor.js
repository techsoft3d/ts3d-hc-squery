import { SQueryResults } from './SQueryResults.js';


export class SQueryEditor {
    
    static _chainSkip = 0;
    static _showLimitOption = true;
    static _showFirstRow = true;
    static _showPropertyStats = true;
    static _hideIFCProperties = false;
    static _searchResultsCallback = null;

    static _htmlEncode(html) {
        html = $.trim(html);
        return html.replace(/[&"'\<\>]/g, function (c) {
            switch (c) {
                case "&":
                    return "&amp;";
                case "'":
                    return "&#39;";
                case '"':
                    return "&quot;";
                case "<":
                    return "&lt;";
                default:
                    return "&gt;";
            }
        });
    }

    static initialize(maindiv, manager, startnode) {
        SQueryEditor.ctrlPressed = false;

     
        $(document).on('keyup keydown', function(e){
            
            SQueryEditor.shiftPressed = e.shiftKey;
            SQueryEditor.ctrlPressed = e.ctrlKey;
        } );

        SQueryEditor._maindiv = maindiv;
        SQueryEditor._manager = manager;
        SQueryEditor._viewer = manager._viewer;
        SQueryEditor._mainFilter = new hcSQuery.SQuery(SQueryEditor._manager, startnode);
        SQueryEditor._mainFilter.tempId = 0;

        new ResizeObserver(function () {
            SQueryEditor.adjust()
           
        }).observe($("#" + SQueryEditor._maindiv)[0]);

        if (!SQueryEditor._searchResultsCallback) {
            SQueryResults.initialize(SQueryEditor._maindiv + '_resultscontainer', manager);
        }
    }

    static setHideIFCProperties(onoff) {
        SQueryEditor._hideIFCProperties = onoff;
    }

    static setChainSkip(skip) {
        SQueryEditor._chainSkip = skip;

    }

    static showFirstRow(showFirstRow) {
        SQueryEditor._showFirstRow = showFirstRow;

    }

    static showPropertyStats(onoff) {
        SQueryEditor._showPropertyStats = onoff;
    }

    static setSearchResultsCallback(callback) {
        SQueryEditor._searchResultsCallback = callback;
    }


    static _generateDropdown() {
        let html = "";
        html += '<button style="right:57px;top:3px;position:absolute;" class="SQuerySearchButton SQueryDropdow-button">...</button>';
        html += '<ul style="right:22px;top:10px;position:absolute;" class="SQueryDropdow-content">';
        html +='<li onclick=\'hcSQuery.SQueryEditor._setSearchChildren(this)\'><span style="left:-5px;position:absolute;">&#x2714</span>Search Children</li>';        
        html +='<li onclick=\'hcSQuery.SQueryEditor._setSearchVisible(this)\'>Search Visible</li>';              
        html +='<li>---</li>';              
        html +='<li onclick=\'hcSQuery.SQueryEditor._toggleLighting()\'>Toggle Lighting</li>';              
        html +='<li onclick=\'hcSQuery.SQueryEditor._viewer.model.setNodesFaceColor([hcSQuery.SQueryEditor._viewer.model.getRootNode()],Communicator.Color.white())\'>Set to White</li>';              
        html += '</ul>';
        return html;
    }

    static _toggleLighting() {
        SQueryEditor._viewer.view.setLightingEnabled(!SQueryEditor._viewer.view.getLightingEnabled());
    }

    static async display() {
        
        await SQueryEditor._manager.initialize();

        let html = "";
        html += '<div class = "SQueryMain" id="' + SQueryEditor._maindiv + '_main">';
        if (SQueryEditor._showFirstRow) {
            html+='<div id = "SQueryEditorFirstRow">';
            if (SQueryEditor._showLimitOption) {
                html += '<div id="' + SQueryEditor._maindiv + '_firstrow" style="position:relative;height:20px;">';
                html += '<button title = "Select nodes current search is limited to" id="SQUeryLimitSelectionButton" disabled style="position:relative;top:-1px"class="SQuerySearchButton" type="button" style="right:65px;top:2px;position:absolute;" onclick=\'hcSQuery.SQueryEditor._limitSelectionShow()\'>Limit</button><input title = "Limit search to currently selected entities" onclick=\'hcSQuery.SQueryEditor._limitSelection()\' style="position:relative;left:-2px;top:2px;" type = "checkbox" id="' + SQueryEditor._maindiv + '_searchfromselection">'
                html += '</div>';
            }
            else {
                html += '<div style="position:relative;height:20px;"></div>';

            }

            html += SQueryEditor._generateDropdown();
            html += '<button class="SQuerySearchButtonImportant" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSQuery.SQueryEditor.search()\'>Search</button>';
            html += '<hr class="SQueryEditorDivider">';
            html += '</div>';
        }

        html += '<div id="' + SQueryEditor._maindiv + '_conditions" class="SQuerySearchtoolsConditions">';
        html += await SQueryEditor._generateConditions();
        html += '</div>';
        
        if (!SQueryEditor._searchResultsCallback) {
            html += '<hr>';
            html += '<div id="' + SQueryEditor._maindiv + '_resultscontainer"</div>';
        }
        html += '</div>';
        $("#" + SQueryEditor._maindiv).empty();
        $("#" + SQueryEditor._maindiv).append(html);

        if (!SQueryEditor._searchResultsCallback) {

            SQueryResults.display();
        }

        if (SQueryEditor._showFirstRow) {
            const SQueryDropdowButton = document.querySelector('.SQueryDropdow-button');
            const SQueryDropdowContent = document.querySelector('.SQueryDropdow-content');

            SQueryDropdowButton.addEventListener('click', function () {
                SQueryDropdowContent.classList.toggle('SQueryDropdowShow');
            });

            window.addEventListener('click', function (event) {
                if (!event.target.matches('.SQueryDropdow-button')) {
                    if (SQueryDropdowContent.classList.contains('SQueryDropdowShow')) {
                        SQueryDropdowContent.classList.remove('SQueryDropdowShow');
                    }
                }
            });
        }

        SQueryEditor._generateSearchResults();
        SQueryEditor._addFilterFromUI(false,0);

    }

    static getFilter() {
        return SQueryEditor._mainFilter;
    }

    static adjust() 
    {

        if (SQueryEditor._searchResultsCallback) {
            return;
        }
        SQueryResults.adjust();

    }

    static flush() {
        $("#" + SQueryEditor._maindiv).empty();
    }


    static async search(doAction = false) {

        SQueryEditor.updateFilterFromUI();
      
        SQueryEditor.clearSearchResults();
        $("#SQueryEditorFirstRow").css("opacity", 0.5);
        $("#SQueryEditorFirstRow").css("pointer-events", "none");
        if (!SQueryEditor._searchResultsCallback) {
            $("#" + SQueryResults._maindiv + "_found").append("Searching...");
        }
        let nodeids = await SQueryEditor._mainFilter.apply();
        $("#SQueryEditorFirstRow").css("opacity", "");
        $("#SQueryEditorFirstRow").css("pointer-events", "");



        let startnode = SQueryEditor._mainFilter.getStartNode();
        SQueryEditor._founditems = new hcSQuery.SQueryResult(this._manager, SQueryEditor._mainFilter);
        SQueryEditor._founditems.generateItems(nodeids, startnode, SQueryEditor._chainSkip);

        SQueryEditor._generateSearchResults();
        if (doAction) {
            SQueryEditor._mainFilter.performAction(nodeids);
        }
    }


    static _getSQueryFromTempId(id) {

        if (id == 0) {
            return SQueryEditor._mainFilter;
        }

        for (let i=0;i<SQueryEditor._mainFilter.getNumConditions();i++)
        {
            let condition = SQueryEditor._mainFilter.getCondition(i);
            if (condition.childFilter && condition.childFilter.tempId == id)
            {
                return condition.childFilter;
            }
        }

    }

    static async _updateSearch() {
        if (SQueryEditor._founditems || SQueryEditor._mainFilter.getNumConditions()) {
            await SQueryEditor.search();
        }
    }

    static resetModel() {                                    
        this._viewer.model.reset();
        this._viewer.model.unsetNodesFaceColor([this._viewer.model.getAbsoluteRootNode()]);
        this._viewer.selectionManager.clear();
    }

    static getFoundItems() {
        return SQueryEditor._founditems;
    }

    static selectAll() {        
                     
        if (!SQueryEditor.ctrlPressed) {
            SQueryEditor._viewer.selectionManager.clear();
        }
        this._founditems.selectAll();
        SQueryEditor._generateSearchResults();
    }

    static updateFilterFromUI(SQueryIn) {
        let SQuery;
        if (!SQueryIn)
        {
            SQuery = SQueryEditor._mainFilter;                 
        }
        else
        {
            SQuery = SQueryIn;
        }

        for (let i = 0; i < SQuery.getNumConditions(); i++) {
            let condition = SQuery.getCondition(i);
            if (condition.childFilter) {
                this.updateFilterFromUI(condition.childFilter);
            }
            else {
                condition.conditionType = hcSQuery.SQueryCondition.convertStringConditionToEnum($("#" + SQueryEditor._maindiv + "_propertyChoiceSelect" + i + "-" + SQuery.tempId)[0].value);
                condition.propertyType = hcSQuery.SQueryCondition.convertStringPropertyTypeToEnum($("#" + SQueryEditor._maindiv + "_propertyTypeSelect" + i + "-" + SQuery.tempId)[0].value);

                let relSet = false;
                if (condition.propertyType == hcSQuery.SQueryPropertyType.relationship) {
                    relSet = true;
                    condition.relationship = hcSQuery.SQueryCondition.convertStringToRelationshipType($("#" + SQueryEditor._maindiv + "_propertyTypeSelect" + i + "-" + SQuery.tempId)[0].value);
                    condition.propertyType = hcSQuery.SQueryPropertyType.nodeName;
                    condition.propertyName = "Node Name";
                }
                if ($("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0] != undefined) {
                    if (!condition.propertyType == hcSQuery.SQueryPropertyType.SQuery) {
                        condition.text = SQueryEditor._htmlEncode($("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0].value);
                    }
                    else {
                        condition.text = $("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0].value;

                    }
                }
                if (!relSet) {
                    condition.propertyName = $("#" + SQueryEditor._maindiv + "_propertyTypeSelect" + i + "-" + SQuery.tempId)[0].value;                
                }
                if (SQueryEditor._showPropertyStats && condition.propertyName.endsWith(")")) {
                    let lastindex = condition.propertyName.lastIndexOf("(") - 1;
                    condition.propertyName = condition.propertyName.substring(0, lastindex);
                }
            }
            if (i == 1) {
                condition.and = ($("#" + SQueryEditor._maindiv + "_andOrchoiceSelect" + i + "-" + SQuery.tempId)[0].value == "and") ? true : false;
            }
            else if (i > 1) {
                condition.and = ($("#" + SQueryEditor._maindiv + "_andOrchoiceSelect" + 1 + "-" + SQuery.tempId)[0].value == "and") ? true : false;
            }    
        }
    }

    static async refreshUI() {     
        $("#" + SQueryEditor._maindiv + "_conditions").empty();
        $("#" + SQueryEditor._maindiv + "_conditions").append(await SQueryEditor._generateConditions());
        SQueryEditor.adjust();

    }
    
    static async _andorchangedFromUI() {
        SQueryEditor.updateFilterFromUI();
        await SQueryEditor.refreshUI();
    }


    static async _convertToChildfilter() {
        let SQuery = SQueryEditor._mainFilter; 
        let newfilter = new hcSQuery.SQuery(SQueryEditor._manager, SQueryEditor._mainFilter.getStartNode());

        for (let i = 0; i < SQuery.getNumConditions(); i++) {

            let condition = SQuery.getCondition(i);
            if (!condition.childFilter) {
                newfilter.addCondition(condition);
                SQuery.removeCondition(i);
                i--;
            }
        }

        if (newfilter.getNumConditions()) {
            let condition = new hcSQuery.SQueryCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(newfilter);

            SQuery.addCondition(condition);

            await SQueryEditor.refreshUI();
        }
            
    }
    static async _addFilterFromUI(createChildFilter, id) {
        let SQuery;
        SQueryEditor.clearSearchResults();
        SQueryEditor.updateFilterFromUI();

        SQuery = SQueryEditor._getSQueryFromTempId(id);
        let childFilter = null;
        if (createChildFilter) {
            childFilter = new hcSQuery.SQuery(SQueryEditor._manager, SQueryEditor._mainFilter.getStartNode());
            childFilter.addCondition(new hcSQuery.SQueryCondition());
        }
            
        if (SQuery.getNumConditions() <= 1) {
            let condition = new hcSQuery.SQueryCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(childFilter);

            SQuery.addCondition(condition);
        }
        else
        {
            let previousCondition = SQuery.getCondition(SQuery.getNumConditions() - 1);
            let condition = new hcSQuery.SQueryCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(childFilter);
            condition.setAndOr(previousCondition.getAndOr());
            SQuery.addCondition(condition);
        }

        await SQueryEditor.refreshUI();
    }


    static _deleteFilter(i,id) {
        SQueryEditor.clearSearchResults();
        SQueryEditor.updateFilterFromUI();
        let SQuery = SQueryEditor._getSQueryFromTempId(id);
        SQuery.removeCondition(i);

        SQueryEditor.refreshUI();

    }

    static _setSearchChildren(el) {
        
        SQueryEditor._manager.setKeepSearchingChildren(!SQueryEditor._manager.getKeepSearchingChildren());
        let text = "Search Children";
        if (SQueryEditor._manager.getKeepSearchingChildren()) {
            text = '<span style="left:-5px;position:absolute;">&#x2714</span>' + text;
        }
        $(el).html(text);
    }

    static _setSearchVisible(el) {
        
        SQueryEditor._manager.setSearchVisible(!SQueryEditor._manager.getSearchVisible());
        let text = "Search Visible";
        if (SQueryEditor._manager.getSearchVisible()) {
            text = '<span style="left:-5px;position:absolute;">&#x2714</span>' + text;
        }
        $(el).html(text);
    }


    static _limitSelectionShow() {
      
        let nodeids = SQueryEditor._mainFilter.getLimitSelectionList();
        SQueryEditor._founditems = new hcSQuery.SQueryResult(this._manager, SQueryEditor._mainFilter);
        SQueryEditor._founditems.generateItems(nodeids,SQueryEditor._viewer.model.getRootNode(),0);

        SQueryEditor.selectAll();        
    }


    static _limitSelection() {
      
        if ($("#" + SQueryEditor._maindiv + "_searchfromselection")[0].checked) {
            let limitselectionlist = [];
            let r = SQueryEditor._viewer.selectionManager.getResults();
            for (let i = 0; i < r.length; i++) {
                limitselectionlist.push(r[i].getNodeId());
            }
            SQueryEditor._mainFilter.limitToNodes(limitselectionlist);
            $( "#SQUeryLimitSelectionButton" ).prop( "disabled", false );
        }
        else
        {
            SQueryEditor._mainFilter.limitToNodes([]);
            $( "#SQUeryLimitSelectionButton" ).prop( "disabled", true );
        }
    }

    static clearSearchResults() {
        SQueryEditor._founditems = undefined; 
        SQueryEditor._generateSearchResults();
    }

    static _generateSearchResults() {
        if (SQueryEditor._searchResultsCallback) {
            SQueryEditor._searchResultsCallback(SQueryEditor._founditems);
        }
        else {
            SQueryResults.generateSearchResults(SQueryEditor._founditems);           
        }
    }


    static _generateAndOrChoiceSelect(condition, filterpos, SQuery) {
        let html = "";
        if (filterpos == 0 || filterpos > 1) {
            if (filterpos ==0) {      
                if (!condition.childFilter) {
                    return '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;width:50px;max-width:50px;min-width:50px">Where:</span>';
                }
                else {
                    return '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;height:20px;width:50px;max-width:50px;min-width:50px">Where:</span>';

                }
            }
            else {
                return '<span style="top:5px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">' + (condition.and ? "and":"or") + '</span>';
            }
        }
        else {

            let html = '<span style="top:5px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">';
            html += '<select class="SQuerySearchSelect" onchange=\'hcSQuery.SQueryEditor._andorchangedFromUI()\' id="' +  
            SQueryEditor._maindiv + '_andOrchoiceSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';

            if (condition.and) {
                html += '<option value="and" selected>and</option>\n';
                html += '<option value="or">or</option>\n';
            }
            else {
                html += '<option value="and">and</option>\n';
                html += '<option value="or" selected>or</option>\n';
            }
                         
            html += '</select></span>\n';
            return html;
        }
    }

    static _generateChoiceSelect(condition, filterpos,SQuery) {

        let html = '<select onchange=\'hcSQuery.SQueryEditor._andorchangedFromUI()\' class="SQueryAndOrSelect" id="' +  
            SQueryEditor._maindiv + '_propertyChoiceSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';

        let choices;
        
        if (condition.propertyName == "SQuery") {
            choices =  ["=", "\u2260"];
        }
        else if (condition.propertyName == "Bounding") {
            choices =  ["evaluate"];
        }
        else if (condition.propertyName == "COG") {
            choices =  ["contains","evaluate", "exists"];
        }
        else {
            choices =  ["contains", "exists","!exists", ">=", "<=",">=(Date)", "<=(Date)", "=", "\u2260"];
        }


        for (let i = 0; i < choices.length; i++) {
            if (choices[i] == hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType)) {
                html += '<option selected value="' + choices[i] + '">' + choices[i] + '</option>\n';
            }
            else {
                html += '<option value="' + choices[i] + '">' + choices[i] + '</option>\n';
            }
        }
       
        html += '</select>\n';
        return html;
    }

    static _clearInputField(filterpos, filterid)
    {
        if ($("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0])
        {
            $("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0].value = "";
        }
    }

    static _generatePropertyTypeSelect(condition, filterpos, SQuery) {
      

        let html = '<select onchange=\'hcSQuery.SQueryEditor._clearInputField(' + filterpos + "," + SQuery.tempId + ');hcSQuery.SQueryEditor._andorchangedFromUI();\' class="SQueryPropertyTypeSelect" id="' +  
            SQueryEditor._maindiv + '_propertyTypeSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';       

        let sortedStrings = SQueryEditor._manager.getAllProperties(SQueryEditor._hideIFCProperties);

        if (SQueryEditor._showPropertyStats) {
            for (let i = 0; i < sortedStrings.length; i++) {
                if (SQueryEditor._showPropertyStats) { }
                let numOptions = SQueryEditor._manager.getNumOptions(sortedStrings[i]);
                if (numOptions) {
                    let numOptionsUsed = SQueryEditor._manager.getNumOptionsUsed(sortedStrings[i]);
                    sortedStrings[i] = sortedStrings[i] + " (" + numOptions + "/" + numOptionsUsed + ")";
                }
            }
        }

        let prefix = "";

        let propertyNamePlus = condition.propertyName;

        if (SQueryEditor._showPropertyStats) {
            let numOptions = SQueryEditor._manager.getNumOptions(propertyNamePlus);
            if (numOptions) {
                let numOptionsUsed = SQueryEditor._manager.getNumOptionsUsed(propertyNamePlus);
                propertyNamePlus = propertyNamePlus + " (" + numOptions + "/" + numOptionsUsed + ")";
            }
        }

        for (let i = 0; i < sortedStrings.length;i++) {
            if (propertyNamePlus == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + prefix + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + prefix + sortedStrings[i] + '</option>\n';
        }
        html += '</select>\n';
        return html;
    }


    static async _updateBoundingDatalist(el) {
        let nodeids = [];
        let r = hcSQuery.SQueryEditor._viewer.selectionManager.getResults();
        for (let i = 0; i < r.length; i++) {
            nodeids.push(r[i].getNodeId());
        }

        if (nodeids.length > 0) {
            let lbounds = await hcSQuery.SQueryEditor._viewer.model.getNodesBounding(nodeids);
            let text = ("bounds:" + lbounds.min.x + " " + lbounds.min.y + " " + lbounds.min.z + " " + lbounds.max.x + " " + lbounds.max.y + " " + lbounds.max.z);
            $(el).next().html('<option value="' + text + '"></option>')
        }
        else {
            $(el).next().html('<option value=""></option>')
        }
        
    }

    static async _updateColorDatalist(el) {

        if (hcSQuery.SQueryEditor._viewer.selectionManager.getLast()) {
            let nodeid = hcSQuery.SQueryEditor._viewer.selectionManager.getLast().getNodeId();
            let children = hcSQuery.SQueryEditor._viewer.model.getNodeChildren(nodeid);
            if (children.length > 0)
                nodeid = children[0];
            let colors = await hcSQuery.SQueryEditor._viewer.model.getNodesEffectiveFaceColor([nodeid]);
            $(el).next().html('<option value="' + colors[0].r + " " + colors[0].g + " " + colors[0].b + '"></option>');
        }
        else {
            $(el).next().html('<option value=""></option>')
        }        
    }

    static async _generateInput(condition,filterpos,SQuery) {
      

        let html = "";
        if (condition.propertyName == "Bounding") {            
            html = '<input type="search" onfocus="hcSQuery.SQueryEditor._updateBoundingDatalist(this)" class = "valueinput" list="datalist' + filterpos + "-" + SQuery.tempId +'" id="' + SQueryEditor._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + SQuery.tempId + '" value="' + condition.text + '">\n';
        }
        else if (condition.propertyName == "Node Color") {
                html = '<input type="search" onfocus="hcSQuery.SQueryEditor._updateColorDatalist(this)" class = "valueinput" list="datalist' + filterpos + "-" + SQuery.tempId +'" id="' + SQueryEditor._maindiv + 
                '_modeltreesearchtext' + filterpos + "-" + SQuery.tempId + '" value="' + condition.text + '">\n';    
        }
        else {
            html = '<input type="search" class = "valueinput" list="datalist' + filterpos + "-" + SQuery.tempId +'" id="' + SQueryEditor._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + SQuery.tempId + '" value="' + condition.text + '">\n';

        }
        html += '<datalist id="datalist' + filterpos + "-" + SQuery.tempId +'">\n';
        let sortedStrings = [];
        if (condition.propertyName == "Node Type") {
            for (const property in Communicator.NodeType) {
                if (isNaN(parseFloat(Communicator.NodeType[property])))
                    sortedStrings.push(Communicator.NodeType[property]);
            }

        }      
        else if (condition.propertyName == "SQuery") {
            let SQuerys = SQueryEditor._manager.getSQuerys();
            for (let i=0;i<SQuerys.length;i++) {
                sortedStrings.push(SQuerys[i].getName());
            }
        }        
        else {
            let options = SQueryEditor._manager.getAllOptionsForProperty(condition.propertyName);
            for (let i in options) {
                sortedStrings.push(i);
            }
        }
        sortedStrings.sort();

        for (let i = 0; i < sortedStrings.length; i++) {
            if (condition.propertyName == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected></option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '"></option>\n';
        }
        html += '</datalist>\n';
        return html;
    }

    static _generateTrashBin() {
        let text = '<div title = "Delete condition" class="icon-trash" style="float: left;">'
        text += '<div class="trash-lid"></div>'
        text += '<div class="trash-container"></div>'
        text += '<div class="trash-line-1"></div>'
        text += '<div class="trash-line-2"></div>'
        text += '<div class="trash-line-3"></div>';
        text += '</div>';
        return text;
    }
    static async _generateConditions(SQueryIn,index) {                
        let html = "";
        let SQuery;
        let tempId;
        if (!SQueryIn)
        {
            SQueryEditor.tempId = 0;
            SQuery = SQueryEditor._mainFilter;                 
        }
        else
        {
            SQuery = SQueryIn;
        }

        SQuery.tempId = SQueryEditor.tempId;

        if (SQueryIn)
        {
                html += '<div class = "SQueryChildCondition" style = "position:relative;left:65px;top:-10px">';
            
        }
        for (let i = 0; i < SQuery.getNumConditions(); i++) {
            let condition = SQuery.getCondition(i);
            if (condition.childFilter) {
                SQueryEditor.tempId++;
                html += '<div>';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSQuery.SQueryEditor._deleteFilter(' + i + "," + SQuery.tempId + ')\'>';
                html += SQueryEditor._generateTrashBin();
                html += '</div>';
                html += SQueryEditor._generateAndOrChoiceSelect(condition, i, SQuery);
                html+= await this._generateConditions(condition.childFilter,i);
                html += '</div>';
            }
            else {
                if (condition.relationship) {
                    html += '<div class="SQueryRelationshipTag" style="left:64px;position:relative">Relationship:' + hcSQuery.SQueryCondition.convertEnumRelationshipTypeToString(condition.relationship) + '</div>';
                }

                html += '<div style="height:30px;margin-top:-3px">';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSQuery.SQueryEditor._deleteFilter(' + i + "," + SQuery.tempId + ')\'>';
                html += SQueryEditor._generateTrashBin();
                html += '</div>';                
                html += SQueryEditor._generateAndOrChoiceSelect(condition, i, SQuery);
                let offset = 66;
                if (SQueryIn) {
                    offset*=2;
                }                
                if (i==1)
                {
                    html += '<div style="display:flex;position:relative;top:-11px;left:64px;margin-right: 1em;width:calc(100%  - ' + offset + 'px)">';
                }
                else
                {
                    html += '<div style="display:flex;position:relative;top:-8px;left:64px;margin-right: 1em;width:calc(100%  - ' + offset + 'px)">';
                }
                html += SQueryEditor._generatePropertyTypeSelect(condition, i, SQuery);
                html += SQueryEditor._generateChoiceSelect(condition, i, SQuery);
                if (hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType) != "exists" && hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType) != "!exists") {
                    html += await SQueryEditor._generateInput(condition, i, SQuery);
                }
                else {
                    html += '<div style="position:relative;left:5px;top:0px;width:275px"></div>';
                }
                html += '</div>';
                html += '</div>';
            }        
        }
        html += '<button title = "Add new condition" class="SQuerySearchButton" type="button" style="margin-top:2px;left:2px;bottom:2px;position:relative;" onclick=\'hcSQuery.SQueryEditor._addFilterFromUI(false,' +  SQuery.tempId + ')\'>Add condition</button>';
        if (!SQueryIn)
        {
            html += '<button title="Add new condition group: hold down Shift to convert existing conditions to group" class="SQuerySearchButton" type="button" style="left:4px;bottom:2px;position:relative;" onclick=\'!hcSQuery.SQueryEditor.shiftPressed ? hcSQuery.SQueryEditor._addFilterFromUI(true,' +  SQuery.tempId + ') : hcSQuery.SQueryEditor._convertToChildfilter(true,' +  SQuery.tempId + ')\'>Add condition group</button>';
        }
        else
        {           
            html += '</div>';    
        }       
        return html;
    }

}