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
var Button = require('react-bootstrap').Button;

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

    var table = this.props.table;
    var headerMenuColIndex = getProperty(table.state, "headerMenuColIndex", -1);
    if (headerMenuColIndex < 0)
        return null;

    var hideColumns = function(){
        var newHiddenRanges = table.state.hiddenColumnRanges.slice();
        var selectedIndices = table.state.selectedIndices;
        var fromCol = selectedIndices[1]
        var toCol = selectedIndices[3];
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
    var directionStr = sortDirection ? 'Ascending' : 'Descending';
    var sortRows = function() {
        table.setState(
            {
                sortColIndex: headerMenuColIndex,
                sortDirection: sortDirection
            }
        );
        table.resetOverlay();
    };

    return (
            <div onMouseDown={overlayClicked} style={overLayStyle} tabIndex='0' className='table-overlay-header-menu'>
                <ul>
                <li className='item' onClick={hideColumns} >Hide Columns</li>
                <li className='item' onClick={sortRows} >Sort {directionStr}</li>
                </ul>
                </div>
    );

  },


  getFilterSelection: function() {
        var table = this.props.table;
        var filterSelection = getProperty(this.state, "filterSelection", null);
        if (filterSelection == null) {
            var filterColIndex = this.props.filterColIndex;
            filterSelection = table.getColumnFilterCriteria(filterColIndex);
        }
        return filterSelection;
  },


  addFilterSelection: function(colVal) {
      var filterSelection = this.getFilterSelection();
      if (filterSelection == null)
          return;

      var foundIndex = binSearchArray(colVal, filterSelection);
      if (foundIndex >= 0)
          return;

      var newColSelection = filterSelection.slice();
      newColSelection.splice(-foundIndex - 1, 0, colVal);

      var table = this.props.table;
      var colIndex = this.props.filterColIndex;
      var filteredRows = table.getFilteredRows(colIndex);
      var colVals = table.getColVals(filteredRows, colIndex);

      var same = newColSelection.length == colVals.length;
      if (same) {
          for (var index = 0; index < newColSelection.length; index++) {
              if (newColSelection[index] != colVals[index]) {
                  same = false;
                  break;
              }
          }
      }
      if (same) {
          newColSelection = null;
      }

      this.setState({filterSelection: newColSelection});
  },

  removeFilterSelection: function(colVal) {
      var filterSelection = this.getFilterSelection();
      var table = this.props.table;
      var filterColIndex = this.props.filterColIndex;
      if (filterSelection == null) {
          filterSelection = table.getColVals(table.getData(), filterColIndex);
      }

      var foundIndex = binSearchArray(colVal, filterSelection);
      if (foundIndex < 0)
          return;

      var newFilterSelection = filterSelection.slice();
      newFilterSelection.splice(foundIndex, 1);

      this.setState({filterSelection: newFilterSelection});
  },



  selectAll: function() {
        var table = this.props.table;
        var filterColIndex = this.props.filterColIndex;
        var rowValues = this.props.table.getFilteredRows(filterColIndex);
        var colVals = table.getColVals(rowValues, filterColIndex);
      this.setState({filterSelection: colVals});
  },

  clearFilterSelection: function() {
      this.setState({filterSelection: []});
  },

  resetState: function(){
      this.setState(
        {filterSelection: null, lastFilterStr: ''}
      );
  },

  renderFilterList: function(overlayClicked, overLayStyle) {
        var table = this.props.table;
        var filterColIndex = this.props.filterColIndex;
        if (filterColIndex < 0)
            return null;
        var filterSelection = this.getFilterSelection();
        var lastFilterStr = getProperty(this.state, "lastFilterStr", "");
        var colVals;
        if (lastFilterStr == '') {
            var rowValues = table.getFilteredRows(filterColIndex);
            colVals = table.getColVals(rowValues, filterColIndex);
        }
        else {
            colVals = filterSelection;
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
                        var foundIndex = binSearchArray(colVal, filterSelection);
                        checked = foundIndex >= 0;
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

            var table = component.props.table;
            var rowValues = table.getFilteredRows(filterColIndex);
            var colVals = table.getColVals(rowValues, filterColIndex);

            var same = true;
            for (var index = 0; index < colVals.length; index++) {
                var colVal = colVals[index];
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
                newSelection = [];
                for (var index = 0; index < colVals.length; index++) {
                    var colVal = colVals[index];
                    if (colVal == 'Blank')
                        continue;
                    var found = colVal.indexOf(filterStr);
                    if (found >= 0) {
                        newSelection.push(colVal);
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
            table.applyFilterCriteria(filterColIndex, component.state.filterSelection);
            component.resetState();
        };
        var cancel = function() {
            table.unapplyFilterCriteria();
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

        var table = this.props.table;
        var filterColIndex = this.props.filterColIndex;
        if (filterColIndex >= 0)
            return this.renderFilterList(overlayClicked, overLayStyle);
        else
            return this.renderHeaderMenu(overlayClicked, overLayStyle);
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
    var table = this.props.table;
    var header = getProperty(table.props, "header", null);
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
                if (leftOrRight && thisRange[1] == colIndex - 1 || !leftOrRight && thisRange[0] == colIndex + 1) {
                    rangeIndex = index;
                    break;
                }
            }

            var newRanges = hiddenRanges.slice(0);
            newRanges.splice(rangeIndex, 1);
            table.setState({hiddenColumnRanges: newRanges});
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
        if (showLeftArrow) {
            leftAndDown1 = (
            <span style={arrowSizeStyle} className='cursor-pointer' onClick={showColumns.bind(table, false)}>{leftArrowStr}</span>
            );
        }
        else {
            leftAndDown1 = (
            <img src='images/transparent10_35.png' ></img>
            );
        }


        var startHeaderButton = function(colIndex) {
            table.setState({inHeaderMenu: colIndex});
        };

        var showDownArrow = (colIndex == tableHeader.state.activeHeaderIndex);
        var leftAndDown2;

        var nonFilteredDownArrowStr = '\u25bc';
        var filteredDownArrowStr = '\u29e8';
        var emptyStr = '\u0020';

        var showHeaderMenu = function(event) {
           event.stopPropagation();
           var x = event.clientX;
           var y = event.clientY;
           table.setState(
             {
                 overlayX: x,
                 overlayY: y,
                headerMenuColIndex: colIndex
             }
           );
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
           table.setState(
             {
                 overlayX: x,
                 overlayY: y,
                 filterColIndex: colIndex
             }
           );
                       event.stopPropagation();
        };

        var downArrowStr;
        var filterCriteria = table.getFilterCriteria();
        if (filterCriteria.length > colIndex && filterCriteria[colIndex] != null)
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
            downAndRight2 = (
            <span style={arrowSizeStyle}  className='cursor-pointer'  onClick={showColumns.bind(table, false)}>{rightArrowStr}</span>
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
            if (table.state.headerMenuColIndex >= 0)
                return;
            var ne = e.nativeEvent;
            if (ne.which != 1)
                return;
            table.setState({
                selectedIndices: [-1, colIndex, -1, colIndex]
            });
        };

        var addSelectionIndices = function() {
            var selectedIndices = table.state.selectedIndices;
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
            var isSelected = checkHeaderSelected(colIndex, table.state.selectedIndices);
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
        table.setState({
            selectedIndices: newSelectedIndices
        });
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

    var tableGetHeaderCellRenderer = getProperty(table, "getHeaderCellRenderer", null);

    var renderedCols = header.map(
      function(col, index, arr) {
        var hidden = isColumnHidden(index, tableHeader.props.hiddenColumnRanges);
        var headerCellRenderer = null;
        if (tableGetHeaderCellRenderer != null)
            headerCellRenderer = tableGetHeaderCellRenderer.get(index);
        if (headerCellRenderer == null)
            headerCellRenderer = defaultHeaderCellRenderer;
        return headerCellRenderer.call(table, col, index, hidden);
      },
      table
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
    var table = this.props.table;

    var tableDataRow = this;
    var defaultDataCellRenderer = function(col, colIndex, rowIndex, hidden, selectCell) {
        var isSelected = checkSelected(rowIndex, colIndex, tableDataRow.props.selectedIndices);
        var centerClassNames = 'center-main';

        var getCellSpec = getProperty(table.props, 'getCellSpec', null);
        var cellSpec = (getCellSpec == null) ? {} : getCellSpec(rowIndex, colIndex);
        if (cellSpec == null)
            cellSpec = {};

        var type = getProperty(cellSpec, "type", null);
        var cellStyle;
        cellStyle = getProperty(cellSpec, "style", {});
        var handleChange = function(event) {
            var val = event.target.value;
            var changes = table.state.data;
            var newChanges = {};
            if (changes != null) {
                for (var key in changes) {
                    if(!changes.hasOwnProperty(key))
                    {
                        continue;
                    }
                    newChanges[key] = changes[key];
                }
            }
            var cellKey = toCellStringKey(rowIndex, colIndex);
            newChanges[cellKey] = val;
            console.log('Will send change for cell: ' + cellKey + ' with value: ' + val);
            table.setState({data: newChanges});
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

        if (type == 'input') {
            return (
              <td  key={colIndex} className='inline-container' style={cellStyle} className={tdClassNames}>
                  <input
                      value={col}
                      className={centerClassNames}
                      onChange={handleChange}
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
                                    }, table
                                );
            return (
              <td  key={colIndex} className='inline-container'  style={cellStyle}  className={tdClassNames}>
                  <select
                      className={centerClassNames}
                      value={col}
                      onChange={handleChange}
                  >
{renderedOptions}
                  </select>
              </td>
            );
        }
        else {
            return (
              <td   key={colIndex} className='inline-container' style={cellStyle}  className={tdClassNames}  onClick={selectCell.bind(this, rowIndex, colIndex)}><span  className={centerClassNames}>{col}</span>
              </td>
            );
        }
    };

    var tableGetDataCellRenderer = getProperty(table, "getDataCellRenderer", null);

    var rowIndex = this.props.rowIndex;

    var renderedCols = this.props.row.map(function(col, index, arr){
        var hidden = isColumnHidden(index, tableDataRow.props.hiddenColumnRanges);

        var dataCellRenderer = null;
        if (tableGetDataCellRenderer != null)
            dataCellRenderer = tableGetDataCellRenderer.get(index);
        if (dataCellRenderer == null)
            dataCellRenderer = defaultDataCellRenderer;
        return dataCellRenderer.call(table, col, index, rowIndex, hidden, table.selectCell);
        }, table);
    var rowVisible = tableDataRow.props.visible;
    var rowClassName = rowVisible ? '' : 'display-none';
    return (
      <tr className={rowClassName}>
        {renderedCols}
      </tr>
    );
  }
});

var TableDataBody = React.createClass({
  getInitialState: function() {
    var initState =
        {
        };
    return initState;
  },

  getCellData: function(rowIndex, colIndex) {
    var origData = this.props.data;
    var changes = getProperty(this.state, "data", {});
    var key = toCellStringKey(rowIndex, colIndex);
    var val;
    if (key in changes)
        val = changes[key];
    else
        val = origData[rowIndex][colIndex];
    return val;
  },

  getRowData: function(rowIndex) {
    var rowLen = this.props.data[0].length;
    var row = [];
    for (var index = 0; index < rowLen; index++) {
        row.push(this.getCellData(rowIndex, index));
    }
    return row;
  },

  checkColCriteria: function(colData, colCriteria) {
    if (colCriteria == null)
        return true;
    var compareColVal;
    if (colData == null)
        compareColval = '';
    else
        compareColVal = colData.trim().toLowerCase();
    var foundIndex = binSearchArray(compareColVal, colCriteria);
    return foundIndex >= 0;
  },

  checkCriteria: function(rowData) {
      filterCriteria = this.props.filterCriteria;
      for (var index = 0; index < filterCriteria.length; index++) {
          var colVal = index < rowData.length ? rowData[index] : null;
          if (!this.checkColCriteria(colVal, filterCriteria[index]))
              return false;
      }
      return true;
  },

  getData: function() {
    var rowLen = this.props.data.length;
    var colLen = this.props.data[0].length;
    var data = [];
    for (var rowIndex = 0; rowIndex < rowLen; rowIndex++) {
        data.push(this.getRowData(rowIndex));
    }
    return data;
  },

  render: function() {

    var dataRows = this.getData();
    var table = this.props.table;
    var tableDataBody = this;
    var sortColIndex = getProperty(table.state, "sortColIndex", -1);
    var sortDirection = getProperty(table.state, "sortDirection", true);
    var sortedDataRows;
    if (sortColIndex < 0)
        sortedDataRows = dataRows;
    else {
        var compareFactor = sortDirection ? 1 : -1;
        var compareRow = function(row1, row2) {
            var colVal1 = (row1 == null || row1.length < sortColIndex) ? null : row1[sortColIndex].toLowerCase();
            var colVal2 = (row2 == null || row2.length < sortColIndex) ? null : row2[sortColIndex].toLowerCase();
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

    var renderedRows =
        sortedDataRows.map(function(row, rowIndex, arr) {
        var visible = this.checkCriteria(row);
        return (
            <TableDataRow visible={visible} table={table} key={rowIndex + 1} row={row} rowIndex={rowIndex}
                selectedIndices={tableDataBody.props.selectedIndices} hiddenColumnRanges={tableDataBody.props.hiddenColumnRanges}>
            </TableDataRow>
            );
        }, this
        );

    return (
      <tbody>
        {renderedRows}
      </tbody>
    );
  }
});

var Table = React.createClass({
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

  getData: function() {
      return this.refs.body.getData();
  },

  getFilterCriteria: function() {
      var filterCriteria = this.state.filterCriteria;
      if (filterCriteria == null) {
        var header = getProperty(this.props, "header", null);
        filterCriteria = [];
        for (var index = 0; index < header.length; index++) {
            filterCriteria.push(null);
        }
      }
      return filterCriteria;
  },

  getColumnFilterCriteria: function(colIndex) {
      var filterCriteria = this.getFilterCriteria();
      return filterCriteria[colIndex];
  },

  colValMatches: function(colVal, filterVal) {
      if (colVal == null)
          return filterVal == 'Blank';
      var trimmed = colVal.trim().toLowerCase();
      if (trimmed.length == 0)
          return filterVal == 'Blank';
      return trimmed == filterVal;
  },

  getFilteredRows: function(filterColIndex) {
      var data = this.getData();
      var filterCriteria = this.getFilterCriteria();
      var filteredRows = data.slice();
      for (var colIndex = 0; colIndex < filterCriteria.length; colIndex++) {
          if (colIndex == filterColIndex)
              continue;
          var colFilter = filterCriteria[colIndex];
          if (colFilter == null)
              continue;

          for (var rowIndex = filteredRows.length - 1; rowIndex >= 0; rowIndex--) {
              var row = filteredRows[rowIndex];
              var colVal = null;
              if (row.length >= colIndex)
                  colVal = row[colIndex];
              if (colVal != null)
                  colVal = colVal.trim().toLowerCase();
              if (colVal == null || colVal.length == 0)
                  colVal = 'Blank';
              var foundIndex = binSearchArray(colVal, colFilter);
              if (foundIndex < 0)
                  filteredRows.splice(rowIndex, 1);
          }
      }
      return filteredRows;
  },

    getColVals: function(rowVals, colIndex) {
        var hasBlank = false;
        var colVals = [];
        for (var rowIndex = 0; rowIndex < rowVals.length; rowIndex++) {
           var rowData = rowVals[rowIndex];
           if (rowData != null && rowData.length > colIndex) {
               var colVal = rowData[colIndex];
               if (colVal == null || colVal.trim().length == 0)
                   hasBlank = true;
               else {
                   colVals.push(colVal.trim().toLowerCase());
               }
           }
           else {
               hasBlank = true;
           }
        }
        colVals.sort();
        for (var index = colVals.length - 1; index > 0; index--) {
           if (colVals[index] == colVals[index - 1]) {
               colVals.splice(index, 1);
           }
        }
        if (hasBlank)
           colVals.push('Blank');
         return colVals;
    },

  applyFilterCriteria: function(colIndex, filterSelection) {
      var newFilterCriteria = this.getFilterCriteria().slice();
      newFilterCriteria[colIndex] = filterSelection;
      this.setState(
          {
              filterCriteria: newFilterCriteria,
            filterColIndex: -1
          }
          );
  },

  unapplyFilterCriteria: function() {
      this.setState({
            filterColIndex: -1
          });
  },

  resetOverlay: function() {
        this.setState({
            filterColIndex: -1,
            headerMenuColIndex: -1
        });
        this.refs.overlay.resetState();
  },

  selectCell: function(rowIndex, colIndex) {
        this.setState({
                selectedIndices: [rowIndex, colIndex, rowIndex, colIndex]
        });
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

    return (
    <div onMouseDown={table.resetOverlay} className='table-outside-container'>
    <div className='table-div-container'>
      <div className='checkbox'> <label><input type="checkbox" onChange={isFilterChanged} value={this.state.isFilter}>Filter</input></label></div>
      <table onMouseUp={onMouseUp} className={tableClassName}>
        <TableHeader table={table} isFilter={table.state.isFilter} hiddenColumnRanges={table.state.hiddenColumnRanges}
         selectedIndices={table.state.selectedIndices} index={0} ref='header'>
        </TableHeader>
        <TableDataBody table={table} data={table.props.data} isFilter={table.state.isFilter} hiddenColumnRanges={table.state.hiddenColumnRanges}
         filterCriteria={table.getFilterCriteria()} selectedIndices={table.state.selectedIndices} index={1} ref='body'>
        </TableDataBody>
      </table>
    </div>
    <TableOverLay ref='overlay' table={table} overlayX={table.state.overlayX} overlayY={table.state.overlayY} filterColIndex={table.state.filterColIndex}>
    </TableOverLay>
    </div>
    );
  }

});

module.exports = Table;
