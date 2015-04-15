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
var DropdownButton = require('react-bootstrap').DropdownButton;
var Button = require('react-bootstrap').Button;
var MenuItem = require('react-bootstrap').MenuItem;
var Modal = require('react-bootstrap').Modal;
var ModalTrigger = require('react-bootstrap').ModalTrigger;

var LayeredComponentMixin = require("../react-components/js/layered-component-mixin").LayeredComponentMixin;

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

var TableFilterList = React.createClass({
  getInitialState: function() {
    var initState =
        {
        };
    return initState;
  },

      componentDidMount: function () {
//          React.findDOMNode(this).focus();
      },

  render: function() {
        var table = this.props.table;
        var filterColIndex = this.props.filterColIndex;
        if (filterColIndex < 0)
            return null;
        var rowValues = this.props.table.getFilteredRows(filterColIndex);
        var colVals = table.getColVals(rowValues, filterColIndex);
        var colCriteria = table.getColumnFilterCriteria(filterColIndex);
        var valSelectionChanged = function(e) {
            var node = e.target;
            if (node.checked)
                table.addFilterCriteria(filterColIndex, node.value);
            else
                table.removeFilterCriteria(filterColIndex, node.value);
        };
        var colFunc = function(colVal, index, arr) {
                    var checked = true;
                    if (colCriteria != null) {
                        var foundIndex = binSearchArray(colVal, colCriteria);
                        checked = foundIndex >= 0;
                    }
                    var liKey = 'li_' + index;
                    return (
                    <li key={liKey} className='item'><label> <input type="checkbox" checked={checked}  onChange={valSelectionChanged} value={colVal}></input>{colVal}</label></li>
                    );
                };
        var overLayStyle = {
            top: this.props.overlayY,
            left: this.props.overlayX
        };
        var selectAll = function(){
            table.resetFilterCriteria(filterColIndex);
        };
        var clear = function() {
            table.clearFilterCriteria(filterColIndex);
        };
        var filterChanged = function() {
        };
        var ok = function() {
            table.applyFilterCriteria();
        };
        var cancel = function() {
            table.unapplyFilterCriteria();
        };


            var overlayClicked = function(e) {
                e.stopPropagation();
            };


        return (
            <div onClick={overlayClicked} style={overLayStyle} tabIndex='0' className='table-overlay-div'>
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
    }
});



var TableHeader = React.createClass({


  getInitialState: function() {
    var initState =
        {
            activeHeaderIndex: -1,
            selectingColumnStartIndex: -1,
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
        var onMouseOver = function(event) {
            tableHeader.setState({
                activeHeaderIndex: colIndex,
                selectingColumnEndIndex: colIndex
            });
        };

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
        if (showLeftArrow) {
            leftAndDown1 = (
            <span onClick={showColumns.bind(table, false)}>{leftArrowStr}</span>
            );
        }
        else {
            leftAndDown1 = (
            <img src='images/transparent16_35.png' ></img>
            );
        }


        var startHeaderButton = function(colIndex) {
            table.setState({inHeaderMenu: colIndex});
        };

        var showDownArrow = (colIndex == tableHeader.state.activeHeaderIndex);
        var leftAndDown2;
        var hideColumns = function(){
            var newHiddenRanges = tableHeader.props.hiddenColumnRanges.slice(0);
            var selectedIndices = tableHeader.props.selectedIndices;
            var fromCol = selectedIndices[1]
            var toCol = selectedIndices[3];
            addHiddenColumn(fromCol, toCol, newHiddenRanges);
            table.setState(
            {
                hiddenColumnRanges: newHiddenRanges,
                selectingColumnStartIndex: -1,
                selectedIndices: [-1, -1, -1, -1],
                inHeaderMenu: -1
            }
            );
        };

        var nonFilteredDownArrowStr = '\u25bc';
        var filteredDownArrowStr = '\u29e8';

        if (showDownArrow) {
            leftAndDown2 = (
                <div className='table-header-menu'>
                <ul>
                <li className='top'>{nonFilteredDownArrowStr}</li>
                <li className='item' onClick={hideColumns} >Hide Columns</li>
                </ul>
                </div>
            );
        }
        else {
            leftAndDown2 = (
             <img src='images/transparent35.png' ></img>
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
        <div className='table-filter-trigger' onClick={showFilterList}>
          {downArrowStr}
        </div>
            );
            }
            else {
                downAndRight1 = (
                 <img src='images/transparent35.png' ></img>
                );

            }

        var downAndRight2;
        if (showRightArrow) {
            downAndRight2 = (
            <span onClick={showColumns.bind(table, false)}>{rightArrowStr}</span>
            );
        }
        else {
            downAndRight2 = (
            <img src='images/transparent16_35.png' ></img>
            );
        }

        var downAndRightArrow = (
            <div className='flex-inline-container table-header-height'>
                {downAndRight1}
                {downAndRight2}
              </div>
              );

        var startSelectingCols = function(colIndex) {
            table.setState({selectingColumnStartIndex: colIndex});
        }

        var endSelectingCols = function(colIndex) {
            var selectedIndices = tableHeader.props.selectedIndices;
            var fromCol;
            var toCol;
            fromCol = selectedIndices[1];
            toCol = selectedIndices[3];

            var currSelectingIndex = table.state.selectingColumnStartIndex;
            if (currSelectingIndex < 0)
                return;

            var fromCol;
            var toCol;
            if (colIndex < currSelectingIndex) {
                fromCol = colIndex;
                toCol = currSelectingIndex;
            }
            else {
                fromCol = currSelectingIndex;
                toCol = colIndex;
            }
            var toCol = colIndex
            table.setState(
            {
                selectedIndices: [0, fromCol, -1, toCol],
                selectingColumnStartIndex: -1
            });
        }

        var classNames = 'unselectable ';

        if (hidden)
            classNames = 'display-none';
        else if (tableHeader.props.selectingColumnStartIndex >= 0 &&
            (table.state.selectingColumnStartIndex <= colIndex && table.state.selectingColumnEndIndex >= colIndex ||
            table.state.selectingColumnStartIndex >= colIndex && table.state.selectingColumnEndIndex <= colIndex)
            ) {
            classNames += 'table-selected';
        }
        else {
            classNames += 'table-unselected';
        }

        return (
          <td key={colIndex} onMouseDown={startSelectingCols.bind(table, colIndex)}
             onMouseUp = {endSelectingCols.bind(table, colIndex)} onMouseOver={onMouseOver} className={classNames}>
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

    var inSelectedRows = fromRow >= 0 && fromRow <= rowIndex && (toRow < 0 || toRow >= rowIndex);
    var inSelectedCols = fromCol >= 0 && fromCol <= colIndex && (toCol < 0 || toCol >= colIndex);
    return inSelectedRows && inSelectedCols;
}


var toCellStringKey = function(rowIndex, colIndex) {
      return '' + rowIndex + '_' + colIndex;
}


var TableDataRow = React.createClass({
  render: function() {
    var table = this.props.table;

        var selectCells = function(rowFrom, colFrom, rowTo, colTo)
        {
            table.setState({selectedIndices: [rowFrom, colFrom, rowTo, colTo]});
        }

    var tableDataRow = this;
    var defaultDataCellRenderer = function(col, colIndex, rowIndex, hidden) {
        var isSelected = checkSelected(rowIndex, colIndex, tableDataRow.props.selectedIndices);
        var centerClassNames = 'center-main';
        if (isSelected)
            centerClassNames += ' table-selected';
        else
            centerClassNames += ' table-unselected';

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

        var tdClassNames = hidden ? 'display-none' : '';

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
              <td  key={colIndex} className='inline-container' style={cellStyle}  className={tdClassNames}>
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
              <td  onClick={selectCells.bind(null, rowIndex, colIndex, rowIndex, colIndex)} key={colIndex} className='inline-container' style={cellStyle}  className={tdClassNames}><span  className={centerClassNames}>{col}</span>
              </td>
            );
        }
    };

    var tableGetDataCellRenderer = getProperty(table, "getDataCellRenderer", null);

    var rowIndex = this.props.rowIndex;

    var renderedCols = this.props.row.map(function(col, index, arr){
        var hidden = isColumnHidden(index, this.props.hiddenColumnRanges);

        var dataCellRenderer = null;
        if (tableGetDataCellRenderer != null)
            dataCellRenderer = tableGetDataCellRenderer.get(index);
        if (dataCellRenderer == null)
            dataCellRenderer = defaultDataCellRenderer;
        return dataCellRenderer.call(table, col, index, rowIndex, hidden);
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
    var renderedRows =
        dataRows.map(function(row, rowIndex, arr) {
        var visible = this.checkCriteria(row);
        return (
            <TableDataRow visible={visible} table={this.props.table} key={rowIndex + 1} table={this} row={row} rowIndex={rowIndex}
                selectedIndices={this.props.selectedIndices} hiddenColumnRanges={this.props.hiddenColumnRanges}>
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
            filterColIndex: -1,
            lastFilterCriteria: null,
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


  resetFilterCriteria: function(colIndex) {
      var colCriteria = this.getColumnFilterCriteria(colIndex);
      if (colCriteria == null)
          return;
      var filterCriteria = this.getFilterCriteria();
      var newFilterCriteria = filterCriteria.slice();
      newFilterCriteria[colIndex] = null;
      this.setState({filterCriteria: newFilterCriteria});
  },

  clearFilterCriteria: function(colIndex) {
      var filterCriteria = this.getFilterCriteria();
      var newFilterCriteria = filterCriteria.slice();
      newFilterCriteria[colIndex] = [];
      this.setState({filterCriteria: newFilterCriteria});
  },

  addFilterCriteria: function(colIndex, colVal) {
      var colCriteria = this.getColumnFilterCriteria(colIndex);
      if (colCriteria == null)
          return;

      var foundIndex = binSearchArray(colVal, colCriteria);
      if (foundIndex >= 0)
          return;

      var newColCriteria = colCriteria.slice();
      newColCriteria.splice(-foundIndex - 1, 0, colVal);

      var filteredRows = this.getFilteredRows(colIndex);
      var colVals = this.getColVals(filteredRows, colIndex);

      var same = newColCriteria.length == colVals.length;
      if (same) {
          for (var index = 0; index < newColCriteria.length; index++) {
              if (newColCriteria[index] != colVals[index]) {
                  same = false;
                  break;
              }
          }
      }
      if (same) {
          newColCriteria = null;
      }

      var filterCriteria = this.getFilterCriteria();
      var newFilterCriteria = filterCriteria.slice();
      newFilterCriteria[colIndex] = newColCriteria;
      this.setState({filterCriteria: newFilterCriteria});
  },

  removeFilterCriteria: function(colIndex, colVal) {
      var colCriteria = this.getColumnFilterCriteria(colIndex);
      if (colCriteria == null) {
          colCriteria = this.getColVals(this.getData(), colIndex);
      }

      var foundIndex = binSearchArray(colVal, colCriteria);
      if (foundIndex < 0)
          return;

      var newColCriteria = colCriteria.slice();
      newColCriteria.splice(foundIndex, 1);

      var filterCriteria = this.getFilterCriteria();
      var newFilterCriteria = filterCriteria.slice();
      newFilterCriteria[colIndex] = newColCriteria;
      this.setState({filterCriteria: newFilterCriteria});
  },

  applyFilterCriteria: function() {
      var newFilterCriteria = this.state.filterCriteria;
      this.setState(
          {
              lastFilterCriteria: newFilterCriteria,
            filterColIndex: -1
          }
          );
  },

  unapplyFilterCriteria: function() {
      var oldFilterCriteria = this.state.lastFilterCriteria;
      this.setState({
          filterCriteria: oldFilterCriteria,
            filterColIndex: -1
          });
  },

  resetOverlay: function() {
        this.setState({
            filterColIndex: -1
        });
  },

  resetFilter: function() {
      var oldFilterCriteria = this.state.lastFilterCriteria;
        this.setState({
            filterCriteria: oldFilterCriteria,
            filterColIndex: -1
        });
  },



  render: function() {
    var table = this;

    var tableClassName = getProperty(this.props, 'className', '');
    var onMouseUp = function(event) {
        table.refs.header.setState({
            selectingColumnStartIndex: -1
        });
    };

    var isFilterChanged = function(event) {
        table.setState({
            isFilter: event.target.checked
        });
    };

    var testSpanStyle = {position: 'absolute', top: '200px', left: '200px'};

    return (
    <div onClick={this.resetFilter} className='table-outside-container'>
    <div className='table-div-container'>
      <div className='checkbox'> <label><input type="checkbox" onChange={isFilterChanged} value={this.state.isFilter}>Filter</input></label></div>
      <table onMouseUp={onMouseUp} className={tableClassName}>
        <TableHeader table={this} isFilter={table.state.isFilter} hiddenColumnRanges={table.state.hiddenColumnRanges}
         selectedIndices={table.state.selectedIndices} index={0} ref='header'>
        </TableHeader>
        <TableDataBody table={this} data={table.props.data} isFilter={table.state.isFilter} hiddenColumnRanges={table.state.hiddenColumnRanges}
         filterCriteria={table.getFilterCriteria()} selectedIndices={table.state.selectedIndices} index={1} ref='body'>
        </TableDataBody>
      </table>
    </div>
    <TableFilterList ref='overlay' table={table} overlayX={this.state.overlayX} overlayY={this.state.overlayY} filterColIndex={this.state.filterColIndex}>
    </TableFilterList>

    </div>
    );
  }

});

module.exports = Table;
