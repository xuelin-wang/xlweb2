/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var React = require('react');
var getProperty = require("../utils/CommonUtils").getProperty;
var binSearchArray = require("../utils/CommonUtils").binSearchArray;
var Immutable = require('immutable');

var ReactPropTypes = React.PropTypes;

var isColumnHidden = function(colIndex, hiddenRanges)
{
    for (var index = 0; index < hiddenRanges.length; index++) {
        var range = hiddenRanges[index];
        if (colIndex >= range[0] && colIndex <= range[1]) {
            return true;
        }
    }
    return false;
}

var addHiddenColumn = function(fromColIndex, toColIndex, hiddenRanges)
{
    var added = false;
    for (var index = hiddenRanges.length - 1; index >= 0; index--) {
        var range = hiddenRanges[index];
        if (fromColIndex <= range[1] && toColIndex >= range[0]) {
            var left = (fromColIndex < range[0]) ? fromColIndex : range[0];
            var right = (toColIndex > range[1]) ? toColIndex : range[1];
            var newRange = [left, right];
            hiddenRanges.splice(index, 1, newRange);
            added = true;
            break;
        }
    }

    if (!added) {
        // make sure ranges are ordered ascending

        for (var index = 0; index <= hiddenRanges.length - 1; index++) {
            var range = hiddenRanges[index];
            if (range[0] > fromColIndex) {
              hiddenRanges.splice(index, 0, [fromColIndex, toColIndex]);
              added = true;
              break;
            }
        }

        if (!added) {
          hiddenRanges.push([fromColIndex, toColIndex]);
        }
    }

    //merge Ranges if can
    for (var index = hiddenRanges.length - 2; index >= 0; index--) {
        var range = hiddenRanges[index];
        var nextRange = hiddenRanges[index + 1];
        if (range[1] >= nextRange[0] && range[0] <= nextRange[1] || range[1] == nextRange[0] - 1 || range[0] == nextRange[1] - 1) {
            var left = (range[0] < nextRange[0]) ? range[0] : nextRange[0];
            var right = (range[1] > nextRange[1]) ? range[1] : nextRange[1];
            var newRange = [left, right];
            hiddenRanges.splice(index, 2, newRange);
        }
    }
}



var TableOverLay = React.createClass({
  getInitialState: function() {
    var initState =
        {
        };
    return initState;
  },

      componentDidMount: function () {
//          React.findDOMNode(this).focus();
      },


  renderHeaderMenu: function(overlayClicked, overLayStyle) {
      var sortDirection = this.props.sortDirection;
      var headerMenuColIndex = this.props.headerMenuColIndex;
      var directionStr = sortDirection ? 'Ascending' : 'Descending';
      var tableOverLay = this;
      var thisSortRows = function() {
          tableOverLay.props.sortRows(headerMenuColIndex, sortDirection);
      };

        return (
                <div onMouseDown={overlayClicked} style={overLayStyle} tabIndex='0' className='table-overlay-header-menu'>
                    <ul>
                    <li className='item' onClick={this.props.hideColumns} >Hide Columns</li>
                    <li className='item' onClick={thisSortRows} >Sort {directionStr}</li>
                    </ul>
                    </div>
        );
  },


  getFilterSelection: function() {
        var filterSelection = getProperty(this.state, "filterSelection", null);
        if (filterSelection == null) {
            filterSelection = this.props.filterColumnCriteria;
        }
        return filterSelection;
  },


  addFilterSelection: function(colVal) {
      var filterSelection = this.getFilterSelection();
      if (filterSelection == null)
          return;

      if (filterSelection.contains(colVal))
          return;

      newColSelection = filterSelection.push(colVal).sort();

      this.setState({filterSelection: newColSelection});
  },

  removeFilterSelection: function(colVal) {
      var filterSelection = this.getFilterSelection();
      var filterColIndex = this.props.filterColIndex;
      if (filterSelection == null) {
          filterSelection = this.props.colVals;
      }

      var pred = function(x){return x === colVal;};
      var kv = filterSelection.findEntry(pred);
      if (kv == null)
          return;

      var newFilterSelection = filterSelection.delete(kv[0]);

      this.setState({filterSelection: newFilterSelection});
  },



  selectAll: function() {
        var filterColIndex = this.props.filterColIndex;
        var colVals = this.props.colVals;
      this.setState({filterSelection: colVals});
  },

  clearFilterSelection: function() {
      this.setState({filterSelection: Immutable.List()});
  },

  resetState: function(){
      this.setState(
        {filterSelection: null, lastFilterStr: ''}
      );
  },

  renderFilterList: function(overlayClicked, overLayStyle) {
        var filterColIndex = this.props.filterColIndex;
        if (filterColIndex < 0)
            return null;

        var filterSelection = this.getFilterSelection();
        var lastFilterStr = getProperty(this.state, "lastFilterStr", "");
        var colVals;
        if (lastFilterStr == '') {
            colVals = this.props.colVals;
        }
        else {
            var pred = function(x) {return x.indexOf(lastFilterStr) >= 0;};
            colVals = this.props.colVals.filter(pred);
        }

        var component = this;
        var valSelectionChanged = function(e) {
            var node = e.target;
            if (node.checked)
                component.addFilterSelection(node.value);
            else
                component.removeFilterSelection(node.value);
        };
        var colFunc = function(colVal, index, arr) {
                    var checked = true;
                    if (filterSelection != null) {
                        checked = filterSelection.contains(colVal);
                    }
                    var liKey = 'li_' + index;
                    return (
                    <li key={liKey} className='item'><label> <input type="checkbox" checked={checked}  onChange={valSelectionChanged} value={colVal}></input>{colVal}</label></li>
                    );
                };

        var selectAll = function(){
            component.selectAll();
        };
        var clear = function() {
            component.clearFilterSelection();
        };
        var filterChanged = function(event) {
            var filterStr = event.target.value.toLowerCase().trim();
            var lastFilterStr = getProperty(component.state, "lastFilterStr", "");
            if (filterStr == lastFilterStr)
                return;

            var colVals = component.props.colVals;

            var same = true;
            for (var index = 0; index < colVals.size; index++) {
                var colVal = colVals.get(index);
                if (colVal == 'Blank')
                    continue;
                var found = colVal.indexOf(filterStr);
                var foundLast = colVal.indexOf(lastFilterStr);
                if (found >= 0 && foundLast < 0 || found < 0 && foundLast >= 0) {
                    same = false;
                    break;
                }
            }

            if (same)
                return;

            var newSelection;
            if (filterStr == '') {
                newSelection = null;
            }
            else {
                newSelection = Immutable.List();
                for (var index = 0; index < colVals.size; index++) {
                    var colVal = colVals.get(index);
                    if (colVal == 'Blank')
                        continue;
                    var found = colVal.indexOf(filterStr);
                    if (found >= 0) {
                        newSelection = newSelection.push(colVal);
                    }
                }
            }

            component.setState(
                {
                    filterSelection: newSelection,
                    lastFilterStr: filterStr
                }
            );
        };

        var ok = function() {
            component.props.applyFilterCriteria(component.state.filterSelection);
            component.resetState();
        };
        var cancel = function() {
            component.props.unapplyFilterCriteria();
            component.resetState();
        };

        return (
            <div onMouseDown={overlayClicked} style={overLayStyle} tabIndex='0' className='table-overlay-div'>
                <a className='cursor-pointer' onClick={selectAll}>Select All</a> <a className='cursor-pointer'  onClick={clear}>Clear</a> <br />
                <input onChange={filterChanged}></input><br />
                <div className='table-filter-menu'>
                <ul>
                    {colVals.map(colFunc)}
                </ul>
                </div>
                <input type='button' onClick={ok} value='OK'></input>
                <input type='button' onClick={cancel} value='Cancel'></input>
            </div>
        );
    },

    render: function() {
            var overlayClicked = function(e) {
                e.stopPropagation();
            };
        var overLayStyle = {
            top: this.props.overlayY,
            left: this.props.overlayX
        };

    var headerMenuColIndex = this.props.headerMenuColIndex;
    var filterColIndex = this.props.filterColIndex;
    if (headerMenuColIndex >= 0)
        return this.renderHeaderMenu(overlayClicked, overLayStyle);
    else if (filterColIndex >= 0)
        return this.renderFilterList(overlayClicked, overLayStyle);
    else
        return null;
    }
});



var TableHeader = React.createClass({


  getInitialState: function() {
    var initState =
        {
            activeHeaderIndex: -1
        };
    return initState;
  },


  render: function() {
    var header = this.props.header;
    if (header == null) {
        return (
            <tr key={0}><td></td></tr>
        );
    }

    var tableHeader = this;

    var defaultHeaderCellRenderer = function(col, colIndex, hidden) {
        var showColumns = function(leftOrRight){
            var hiddenRanges = tableHeader.props.hiddenColumnRanges;
            var rangeIndex = -1;
            for (var index = 0; index < hiddenRanges.length; index++) {
                var thisRange = hiddenRanges[index];
                if (!leftOrRight && thisRange[1] == colIndex - 1 || leftOrRight && thisRange[0] == colIndex + 1) {
                    rangeIndex = index;
                    break;
                }
            }

            var newRanges = hiddenRanges.slice(0);
            newRanges.splice(rangeIndex, 1);
            tableHeader.props.setHiddenColumns(newRanges);
        };

        var showLeftArrow = false;
        var showRightArrow = false;
        var hiddenRanges = tableHeader.props.hiddenColumnRanges;
        for (var index = 0; index < hiddenRanges.length; index++) {
            var range = hiddenRanges[index];
            if (colIndex == range[0] - 1) {
                showRightArrow = true;
            }
            if (colIndex == range[1] + 1) {
                showLeftArrow = true;
            }
        }

        var leftArrowStr = '\u25c0';
        var leftAndDown1;
        var arrowSizeStyle= {
            width: "10px",
            height: "35px"
        };
        var leftShowColumns = function() {
            showColumns(true);
        };
        if (showLeftArrow) {
            leftAndDown1 = (
            <span style={arrowSizeStyle} className='cursor-pointer' onClick={leftShowColumns}>{leftArrowStr}</span>
            );
        }
        else {
            leftAndDown1 = (
            <img src='images/transparent10_35.png' ></img>
            );
        }


        var showDownArrow = (colIndex == tableHeader.state.activeHeaderIndex);
        var leftAndDown2;

        var nonFilteredDownArrowStr = '\u25bc';
        var filteredDownArrowStr = '\u29e8';
        var emptyStr = '\u0020';

    var showHeaderMenu = function(event) {
       event.stopPropagation();
       var x = event.clientX;
       var y = event.clientY;
       tableHeader.props.showHeaderMenu(x, y, colIndex);
    };

        if (showDownArrow) {
            leftAndDown2 = (
                <span  style={arrowSizeStyle} onMouseDown={showHeaderMenu} className='table-filter-trigger'>{nonFilteredDownArrowStr}</span>
            );
        }
        else {
            leftAndDown2 = (
            <img src='images/transparent10_35.png' ></img>
            );
        }

        var leftAndDownArrow = (
            <div className='flex-inline-container'>
                {leftAndDown1}
                {leftAndDown2}
              </div>
              );



        var rightArrowStr = '\u25b6';
        var downAndRight1;
        var showFilterArrow = tableHeader.props.isFilter;
        if (showFilterArrow) {



             var filterChanged = function(colIndex, colVal) {
             
             };


        var showFilterList = function(event) {
           var x = event.clientX;
           var y = event.clientY;
           event.stopPropagation();
           tableHeader.props.showFilterList(x, y, colIndex);
        };

        var downArrowStr;
        var filterCriteria = tableHeader.props.filterCriteria;
        if (filterCriteria.size > colIndex && filterCriteria.get(colIndex) != null)
            downArrowStr = filteredDownArrowStr;
        else
            downArrowStr = nonFilteredDownArrowStr;

            downAndRight1 = (
        <div  style={arrowSizeStyle}  className='table-filter-trigger' onClick={showFilterList}>
          {downArrowStr}
        </div>
            );
            }
            else {
                downAndRight1 = (
                 <img src='images/transparent10_35.png' ></img>
                );

            }

        var downAndRight2;
        if (showRightArrow) {
            var rightShowColumns = function() {
                showColumns(false);
            };
            downAndRight2 = (
            <span style={arrowSizeStyle}  className='cursor-pointer'  onClick={rightShowColumns}>{rightArrowStr}</span>
            );
        }
        else {
            downAndRight2 = (
            <img src='images/transparent10_35.png' ></img>
            );
        }

        var downAndRightArrow = (
            <div className='flex-inline-container table-header-height'>
                {downAndRight1}
                {downAndRight2}
              </div>
              );

        var startSelectingCol = function(e) {
            if (tableHeader.props.headerMenuColIndex >= 0)
                return;
            var ne = e.nativeEvent;
            if (ne.which != 1)
                return;
            tableHeader.props.selectIndices([-1, colIndex, -1, colIndex]);
        };

        var addSelectionIndices = function() {
            var selectedIndices = tableHeader.props.selectedIndices;
            var lowerCol = selectedIndices[1];
            var upperCol = selectedIndices[3];
            if (lowerCol < 0 || upperCol < 0) {
                return [-1, colIndex, -1, colIndex];
            }

            var newLowerCol = colIndex < lowerCol ? colIndex : lowerCol;
            var newUpperCol = colIndex > upperCol ? colIndex : upperCol;
            return [-1, newLowerCol, -1, newUpperCol];
        };

        var classNames = 'unselectable ';

        if (hidden)
            classNames = 'display-none';
        else {
            var isSelected = checkHeaderSelected(colIndex, tableHeader.props.selectedIndices);
            if (isSelected) {
                classNames += 'header-selected';
            }
            else {
                classNames += 'header-unselected';
            }
        }

        var onMouseOut = function(e) {
            tableHeader.setState({
                activeHeaderIndex: -1
            });
        };

var onMouseOver = function(e) {
    tableHeader.setState({
        activeHeaderIndex: colIndex
    });
};

var onMouseEnter = function(e) {
    var ne = e.nativeEvent;
    if (ne.which == 1) {
        var newSelectedIndices = addSelectionIndices();
        tableHeader.props.selectIndices(newSelectedIndices);
    };
};

        return (
          <td key={colIndex} onMouseDown={startSelectingCol} onMouseEnter={onMouseEnter}
             onMouseOver={onMouseOver} onMouseOut={onMouseOut}  className={classNames}>
          <div className='flex-inline-container'>
          {leftAndDownArrow}
          <div className='flex-inline-container table-header-height'>
          <b>{col}</b>
          </div>
          {downAndRightArrow}
          </div>
          </td>
        );
    };

    var tableGetHeaderCellRenderer = tableHeader.props.headerCellRenderer;

    var renderedCols = header.map(
      function(col, index, arr) {
        var hidden = isColumnHidden(index, tableHeader.props.hiddenColumnRanges);
        var headerCellRenderer = null;
        if (tableGetHeaderCellRenderer != null)
            headerCellRenderer = tableGetHeaderCellRenderer.get(index);
        if (headerCellRenderer == null)
            headerCellRenderer = defaultHeaderCellRenderer;
        return headerCellRenderer.call(tableHeader, col, index, hidden);
      },
      null
    );

    return (
      <tr key={0}>
        {renderedCols}
      </tr>
    );
  }
});

var checkSelected = function(rowIndex, colIndex, selectedIndices)
{
    var fromRow = selectedIndices[0];
    var fromCol = selectedIndices[1];
    var toRow = selectedIndices[2];
    var toCol = selectedIndices[3];

    var inSelectedRows = (fromRow < 0 || fromRow >= 0 && fromRow <= rowIndex) && (toRow < 0 || toRow >= rowIndex);
    var inSelectedCols = fromCol >= 0 && fromCol <= colIndex && (toCol < 0 || toCol >= colIndex);
    return inSelectedRows && inSelectedCols;
}

var checkHeaderSelected = function(colIndex, selectedIndices)
{
    var fromRow = selectedIndices[0];
    var fromCol = selectedIndices[1];
    var toRow = selectedIndices[2];
    var toCol = selectedIndices[3];

    var inSelectedCols = fromCol >= 0 && fromCol <= colIndex && (toCol < 0 || toCol >= colIndex);
    return inSelectedCols;
}


var toCellStringKey = function(rowIndex, colIndex) {
      return '' + rowIndex + '_' + colIndex;
}


var TableDataRow = React.createClass({
  render: function() {
    var tableDataRow = this;
    var defaultDataCellRenderer = function(col, colIndex, rowIndex, hidden, selectCell) {
        var isSelected = checkSelected(rowIndex, colIndex, tableDataRow.props.selectedIndices);
        var centerClassNames = 'center-main';

        var getCellSpec = tableDataRow.props.getCellSpec;
        var cellSpec = (getCellSpec == null) ? {} : getCellSpec(rowIndex, colIndex);
        if (cellSpec == null)
            cellSpec = {};

        var type = getProperty(cellSpec, "type", null);
        var cellStyle;
        cellStyle = getProperty(cellSpec, "style", {});
        var handleChange = function(event) {
            var val = event.target.value;
            console.log('Will send change for cell rowIndex: ' + rowIndex + ', colIndex: ' + colIndex + ' with value: ' + val);
            tableDataRow.props.setCellDataChange(rowIndex, colIndex, val);
        };

        var tdClassNames;
        if (hidden) {
            tdClassNames = 'display-none';
        }
        else {
            if (isSelected) {
                if (tableDataRow.props.selectedIndices[0] == rowIndex)
                    tdClassNames = ' cell-selected';
                else
                    tdClassNames = ' body-selected';
            }
            else
                tdClassNames = ' body-unselected';
        }

        var thisSelectCell = function() {
            selectCell(rowIndex, colIndex);
        };

        if (type == 'input') {
            return (
              <td  key={colIndex} className='inline-container' style={cellStyle} className={tdClassNames} >
                  <input
                      value={col}
                      className={centerClassNames}
                      onChange={handleChange}
                       onFocus={thisSelectCell}
                      ></input>
              </td>
            );
        }
        else if (type == 'select') {
            var renderedOptions = cellSpec.options.map(
                                    function(opt, optIndex, opts) {
                                        return (
                                            <option key={optIndex} value={opt[0]}>{(opt.length > 1) ? opt[1] : opt[0]}</option>
                                        );
                                    }, null
                                );
            return (
              <td  key={colIndex} className='inline-container'  style={cellStyle}  className={tdClassNames} >
                  <select
                      className={centerClassNames}
                      value={col}
                      onChange={handleChange}
                       onFocus={thisSelectCell}
                  >
{renderedOptions}
                  </select>
              </td>
            );
        }
        else {
            return (
              <td   key={colIndex} className='inline-container' style={cellStyle}  className={tdClassNames}
                  onClick={thisSelectCell}
              >
                  <span  className={centerClassNames}>{col}</span>
              </td>
            );
        }
    };

    var tableGetDataCellRenderer = this.props.getDataCellRenderer;

    var rowIndex = this.props.rowIndex;

    var renderedCols = null;
    var row =  this.props.row;
    if (row.size > 1) {
        var origRowIndex = row.get(0).get("rowIndex");
        renderedCols = row.takeLast(row.size - 1).map(function(col, index, arr){
            var hidden = isColumnHidden(index, tableDataRow.props.hiddenColumnRanges);

            var dataCellRenderer = null;
            if (tableGetDataCellRenderer != null)
                dataCellRenderer = tableGetDataCellRenderer.get(index);
            if (dataCellRenderer == null)
                dataCellRenderer = defaultDataCellRenderer;
            return dataCellRenderer.call(null, col, index, origRowIndex, hidden, tableDataRow.props.selectCell);
            }, null);
        var rowVisible = tableDataRow.props.visible;
        var rowClassName = rowVisible ? '' : 'display-none';
        return (
          <tr className={rowClassName}>
            {renderedCols}
          </tr>
        );
    }
  }
});

var TableDataBody = React.createClass({
  getInitialState: function() {
    var initState =
        {
        };
    return initState;
  },

  render: function() {

    var dataRows = this.props.data;
    var tableDataBody = this;
    var sortColIndex = this.props.sortColIndex;
    var sortDirection = this.props.sortDirection;
    var sortedDataRows;
    if (sortColIndex < 0)
        sortedDataRows = dataRows;
    else {
        var compareFactor = sortDirection ? 1 : -1;
        var compareRow = function(row1, row2) {
            var colVal1 = (row1 == null || row1.size < sortColIndex + 1) ? null : row1.get(sortColIndex + 1).toLowerCase();
            var colVal2 = (row2 == null || row2.size < sortColIndex + 1) ? null : row2.get(sortColIndex + 1).toLowerCase();
            if (colVal1 == null) {
                if (colVal2 == null)
                    return 0;
                else
                    return -compareFactor;
            }
            else if (colVal2 == null)
            {
                return compareFactor;
            }
            else {
                if (colVal1 < colVal2)
                    return -compareFactor;
                else if (colVal1 > colVal2)
                    return compareFactor;
                else
                    return 0;
            }
        };

        sortedDataRows = dataRows.sort(compareRow);
    }

    var checkCriteria = tableDataBody.props.checkCriteria;
    var getDataCellRenderer = tableDataBody.props.getDataCellRenderer;
    var renderedRows =
        sortedDataRows.map(function(row, rowIndex, arr) {
            var visible = checkCriteria(row);
            var key = row.get(0).get("rowIndex");
            return (
                <TableDataRow
                    visible={visible} key={key} row={row} rowIndex={rowIndex}
                    setCellDataChange={tableDataBody.props.setCellDataChange}
                    getCellSpec={tableDataBody.props.getCellSpec}
                    getDataCellRenderer={getDataCellRenderer}
                    selectCell={tableDataBody.props.selectCell}
                    selectedIndices={tableDataBody.props.selectedIndices} hiddenColumnRanges={tableDataBody.props.hiddenColumnRanges}>
                </TableDataRow>
                );
            }, null
        );

    return (
      <tbody>
        {renderedRows}
      </tbody>
    );
  }
});

var Table = React.createClass({

//  shouldComponentUpdate: function(nextProps, nextState) {
//      return true;
//  },

  getInitialState: function() {
    var initState =
        {
            isFilter: false,
            hiddenColumnRanges: [],
            headerMenuColIndex: -1,
            filterColIndex: -1,
            filterCriteria: null,
            selectedIndices: [-1, -1, -1, -1]
        };
    return initState;
  },

//  shouldComponentUpdate: function(nextProps, nextState) {
//      return true;
//  },

  setCellData: function(rowIndex, colIndex, val) {
        var newData = getProperty(this.state, "data", this.props.data, this.props.data);
        var row = newData.get(rowIndex);
        row = row.set(colIndex + 1, val);
        newData = newData.set(rowIndex, row);
        this.setState({data: newData});
  },

  checkColCriteria: function(colData, colCriteria) {
    if (colCriteria == null)
        return true;
    var compareColVal;
    if (colData == null)
        compareColval = 'Blank';
    else
        compareColVal = colData.trim().toLowerCase();
    return colCriteria.contains(compareColVal);
  },

  getData: function() {
    return getProperty(this.state, "data", this.props.data, this.props.data);
  },

  getFilterCriteria: function() {
      var filterCriteria = this.state.filterCriteria;
      if (filterCriteria == null) {
        var header = getProperty(this.props, "header", null);
        filterCriteria = Immutable.List();
        for (var index = 0; index < header.length; index++) {
            filterCriteria = filterCriteria.push(null);
        }
      }
      return filterCriteria;
  },


  getFilteredRows: function(filterColIndex) {
      var data = this.getData();
      var filterCriteria = this.getFilterCriteria();
      var filteredRows = Immutable.List();
      for (var rowIndex = 0; rowIndex < data.size; rowIndex++) {
          var good = true;
          var row = data.get(rowIndex);
          for (var colIndex = 0; colIndex < filterCriteria.size; colIndex++) {
              if (colIndex == filterColIndex)
                  continue;
              var colFilter = filterCriteria.get(colIndex);
              if (colFilter == null)
                  continue;
              var colVal = null;
              if (row.size > colIndex + 1)
                  colVal = row.get(colIndex + 1);
              if (colVal != null)
                  colVal = colVal.trim().toLowerCase();
              if (colVal == null || colVal.length == 0)
                  colVal = 'Blank';
              if (!colFilter.contains(colVal)) {
                  good = false;
                  break;
              }
          }

          if (good)
              filteredRows = filteredRows.push(row);
      }
      return filteredRows;
  },

    getColVals: function(rowVals, colIndex) {
        var colVals = Immutable.Set();
        for (var rowIndex = 0; rowIndex < rowVals.size; rowIndex++) {
           var rowData = rowVals.get(rowIndex);
           if (rowData.size > colIndex + 1) {
               var colVal = rowData.get(colIndex + 1);
               if (colVal == null || colVal.trim().length == 0)
                   colVals = colVals.add('Blank');
               else {
                   colVals = colVals.add(colVal.trim().toLowerCase());
               }
           }
           else {
               colVals = colVals.add('Blank');
           }
        }
        var colValsList = colVals.toList();
        colValsList = colValsList.sort();
        return colValsList;
    },

  resetOverlay: function() {
        this.setState({
            filterColIndex: -1,
            headerMenuColIndex: -1
        });
        this.refs.overlay.resetState();
  },




  render: function() {
    var table = this;

    var tableClassName = getProperty(this.props, 'className', '');
    if (tableClassName == '')
        tableClassName = 'default-table';
    var onMouseUp = function(event) {
    };

    var isFilterChanged = function(event) {
        if (event.target.checked) {
            table.setState({
                isFilter: event.target.checked
            });
        }
        else {
            table.setState({
                isFilter: event.target.checked,
                filterCriteria: null,
                filterColIndex: -1

            });
        }
    };

    var testSpanStyle = {position: 'absolute', top: '200px', left: '200px'};

    var headerMenuColIndex = getProperty(table.state, "headerMenuColIndex", -1);
    var filterColIndex = getProperty(table.state, "filterColIndex", -1);
    var headerMenuProps = {};
    headerMenuProps.headerMenuColIndex = headerMenuColIndex;
    if (headerMenuColIndex >= 0) {
        var hideColumns = function(){
            var newHiddenRanges = table.state.hiddenColumnRanges.slice();
            var selectedIndices = table.state.selectedIndices;
            var fromCol = selectedIndices[1]
            var toCol = selectedIndices[3];
            if (fromCol < 0 || toCol < 0) {
                fromCol = headerMenuColIndex;
                toCol = headerMenuColIndex;
            }

            addHiddenColumn(fromCol, toCol, newHiddenRanges);
            table.setState(
            {
                hiddenColumnRanges: newHiddenRanges,
                selectedIndices: [-1, -1, -1, -1],
                inHeaderMenu: -1
            }
            );
            table.resetOverlay();
        };
        headerMenuProps.hideColumns = hideColumns;

        var sortColIndex = getProperty(table.state, 'sortColIndex', -1);
        var sortDirection = getProperty(table.state, 'sortDirection', true);
        if (sortColIndex < 0) {
            sortDirection = true;
        }
        else {
            if (sortColIndex == headerMenuColIndex)
                sortDirection = !sortDirection;
            else
                sortDirection = true;
        }
        headerMenuProps.sortDirection = sortDirection;

        var sortRows = function(sortColIndex, sortDirection) {
            table.setState(
                {
                    sortColIndex: sortColIndex,
                    sortDirection: sortDirection
                }
            );
            table.resetOverlay();
        };
        headerMenuProps.sortRows = sortRows;

    }

    var filterProps = {};
    filterProps.filterColIndex = filterColIndex;
    if (filterColIndex >= 0) {
       var filterColumnCriteria = table.getFilterCriteria().get(filterColIndex);
       filterProps.filterColumnCriteria = filterColumnCriteria;

      var filteredRows = table.getFilteredRows(filterColIndex);
      var colVals = table.getColVals(filteredRows, filterColIndex);
      filterProps.colVals = colVals;

      var applyFilterCriteria = function(filterSelection) {
          var newFilterCriteria = table.getFilterCriteria().set(filterColIndex, filterSelection);
          table.setState(
              {
                  filterCriteria: newFilterCriteria,
                filterColIndex: -1
              }
              );
      };

      var unapplyFilterCriteria = function() {
          table.setState({
                filterColIndex: -1
              });
      };

      filterProps.applyFilterCriteria = applyFilterCriteria;

      filterProps.unapplyFilterCriteria = unapplyFilterCriteria;
    }

    var setHiddenColumns = function(newHiddenRanges)
     {
        table.setState({hiddenColumnRanges: newHiddenRanges})
     };


    var showHeaderMenu = function(x, y, colIndex) {
       table.setState(
         {
             overlayX: x,
             overlayY: y,
            headerMenuColIndex: colIndex
         }
       );
    };

    var header = getProperty(table.props, "header", null);
    var headerCellRenderer = getProperty(table, "getHeaderCellRenderer", null);
    var selectIndices = function(selectedIndices) {
            table.setState({
                selectedIndices:selectedIndices
            });
    };

    var filterCriteria = table.getFilterCriteria();
    var showFilterList = function(x, y, colIndex) {
           table.setState(
             {
                 overlayX: x,
                 overlayY: y,
                 filterColIndex: colIndex
             }
           );
    };

    var getCellSpec = getProperty(table.props, 'getCellSpec', null);
    var getDataCellRenderer = getProperty(table, "getDataCellRenderer", null);

    var sortColIndex = getProperty(table.state, "sortColIndex", -1);
    var sortDirection = getProperty(table.state, "sortDirection", true);

    var checkCriteria = function(rowData) {
          filterCriteria = table.getFilterCriteria();
          for (var index = 0; index < filterCriteria.size; index++) {
              var colVal = index + 1 < rowData.size ? rowData.get(index + 1) : null;
              if (!table.checkColCriteria(colVal, filterCriteria.get(index)))
                  return false;
          }
          return true;
      };

  var selectCell = function(rowIndex, colIndex) {
        table.setState({
                selectedIndices: [rowIndex, colIndex, rowIndex, colIndex]
        });
  };


    return (
    <div onMouseDown={table.resetOverlay} className='table-outside-container'>
    <div className='table-div-container'>
      <div className='checkbox'> <label><input type="checkbox" onChange={isFilterChanged} value={this.state.isFilter}>Filter</input></label></div>
      <table onMouseUp={onMouseUp} className={tableClassName}>
        <TableHeader header={header} headerCellRenderer={headerCellRenderer} setHiddenColumns={setHiddenColumns}
             showHeaderMenu={showHeaderMenu}
             filterCriteria={filterCriteria}
             selectIndices={selectIndices}
             headerMenuColIndex={headerMenuColIndex}
             showFilterList={showFilterList}
             isFilter={table.state.isFilter}
             hiddenColumnRanges={table.state.hiddenColumnRanges}
             selectedIndices={table.state.selectedIndices}
           index={0} ref='header'
         >
        </TableHeader>
        <TableDataBody
            data={table.getData()}
            isFilter={table.state.isFilter}
            hiddenColumnRanges={table.state.hiddenColumnRanges}
             filterCriteria={filterCriteria}
             selectedIndices={table.state.selectedIndices}
             setCellDataChange={table.setCellData}
             getCellSpec={getCellSpec}
             getDataCellRenderer={getDataCellRenderer}
             sortColIndex={sortColIndex}
             sortDirection={sortDirection}
             checkCriteria={checkCriteria}
             selectCell={selectCell}
             index={1}
             ref='body'>
        </TableDataBody>
      </table>
    </div>
    <TableOverLay ref='overlay'
        {...headerMenuProps}
        {...filterProps}
        overlayX={table.state.overlayX} overlayY={table.state.overlayY}
    >
    </TableOverLay>
    </div>
    );
  }

});

module.exports = Table;
