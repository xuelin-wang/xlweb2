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
var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;

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

var TableHeader = React.createClass({
  render: function() {
    var table = this.props.table;
    var header = getProperty(table.props, "header", null);
    if (header == null) {
        return (
            <tr key={0}><td></td></tr>
        );
    }

    var defaultHeaderCellRenderer = function(col, colIndex) {
        var onMouseOver = function(index) {
            table.setState({activeHeaderIndex: index});
        };
        var onMouseOut = function(index) {
        };

        var showColumns = function(leftOrRight){
            var hiddenRanges = table.state.hiddenColumnRanges;
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

        var leftArrowStr = '\u25c0';
        var showLeftArrow = false;
        var showRightArrow = false;
        var hiddenRanges = table.state.hiddenColumnRanges;
        for (var index = 0; index < hiddenRanges.length; index++) {
            var range = hiddenRanges[index];
            if (colIndex == range[0] - 1) {
                showRightArrow = true;
            }
            if (colIndex == range[1] + 1) {
                showLeftArrow = true;
            }
        }

        if (showLeftArrow) {
            leftArrow = (
            <section  className='arrow-left table-header-height'>
                  <span onClick={showColumns.bind(table, true)}>{leftArrowStr}</span>
                  </section>
                  );
        }
        else {
            leftArrow = (
            <section  className='arrow-left table-header-height'>
                  <img src='images/transparent16_35.png'></img>
                  </section>
              );
        }

        var showDownArrow = (colIndex == table.state.activeHeaderIndex);
//        var downArrowStr = '\u25bc';
        var hideColumns = function(){
            var newHiddenRanges = table.state.hiddenColumnRanges.slice(0);
            var selectedIndices = table.state.selectedIndices;
            var fromCol = selectedIndices[1];
            var toCol = selectedIndices[3];
            addHiddenColumn(fromCol, toCol, newHiddenRanges);
            table.setState(
            {
                hiddenColumnRanges: newHiddenRanges,
                selectingColumnIndex: -1,
                selectedIndices: [-1, -1, -1, -1],
                inHeaderMenu: -1
            }
            );
        };

        var startHeaderButton = function(colIndex) {
            table.setState({inHeaderMenu: colIndex});
        };

        var downArrowButton = (
            <DropdownButton bsStyle='link' onMouseDown={startHeaderButton.bind(table, colIndex)} className='header-down-size' title='' key={0}>
                <MenuItem onClick={hideColumns} >Hide Column(s)</MenuItem>
            </DropdownButton>
        );

        var rightArrowStr = '\u25b6';
        var downAndRightArrow;
        if (!showDownArrow && !showRightArrow) {
            downAndRightArrow = (
            <section className='arrow-right table-header-height'>
             <img src='images/transparent35.png' ></img>
              <img src='images/transparent16_35.png' ></img>
              </section>
              );
        }
        else if (!showDownArrow) {
            downAndRightArrow = (
            <section className='arrow-right table-header-height'>
             <img src='images/transparent35.png' ></img>
             <span onClick={showColumns.bind(table, false)}>{rightArrowStr}</span>
              </section>
            );
        }
        else if (!showRightArrow) {
            downAndRightArrow = (
            <section className='arrow-right table-header-height'>
             {downArrowButton}
              <img src='images/transparent16_35.png'></img>
              </section>
            );
        }
        else {
            downAndRightArrow = (
            <section className='arrow-right table-header-height'>
             {downArrowButton}
             <span onClick={showColumns.bind(table, false)}>{rightArrowStr}</span>
              </section>
            );
        }

        var startSelectingCols = function(colIndex) {
            table.setState({selectingColumnIndex: colIndex});
        }

        var endSelectingCols = function(colIndex) {
            var inHeaderMenu = table.state.inHeaderMenu;
            var selectedIndices = table.state.selectedIndices;
            var fromCol;
            var toCol;
            fromCol = selectedIndices[1];
            toCol = selectedIndices[3];
            if (fromCol >= 0 && inHeaderMenu >= fromCol && (toCol < 0 || toCol >= inHeaderMenu)) {
                table.setState({selectingColumnIndex: -1});
                return;
            }

            var currSelectingIndex = table.state.selectingColumnIndex;
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
                selectingColumnIndex: -1
            });
        }

        return (
          <td key={colIndex} onMouseDown={startSelectingCols.bind(table, colIndex)} onMouseUp = {endSelectingCols.bind(table, colIndex)} onMouseOver={onMouseOver.bind(table, colIndex)} onMouseOut={onMouseOut.bind(table, colIndex)} className='inline-container'>
          {leftArrow}
          <section className='inline-block table-header-height'>
          <b>{col}</b>
          </section>
          {downAndRightArrow}
          </td>
        );
    };

    var tableGetHeaderCellRenderer = getProperty(table, "getHeaderCellRenderer", null);

    var renderedCols = header.map(
      function(col, index, arr) {
        if (isColumnHidden(index, table.state.hiddenColumnRanges))
            return '';
        var headerCellRenderer = null;
        if (tableGetHeaderCellRenderer != null)
            headerCellRenderer = tableGetHeaderCellRenderer.get(index);
        if (headerCellRenderer == null)
            headerCellRenderer = defaultHeaderCellRenderer;
        return headerCellRenderer.call(table, col, index);
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


    var defaultDataCellRenderer = function(col, colIndex, rowIndex) {
        var isSelected = checkSelected(rowIndex, colIndex, table.state.selectedIndices);
        var centerClassNames = 'center-main';
        if (isSelected)
            centerClassNames += ' table-selected';
        else
            centerClassNames += ' table-unselected';

        var getCellSpec = getProperty(table.props, 'getCellSpec', null);
        var cellSpec = (getCellSpec == null) ? {} : getCellSpec.get(rowIndex, colIndex);

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
            table.setState({data: newChanges});
        };

        if (type == 'input') {
            return (
              <td  key={colIndex} className='inline-container' style={cellStyle} >
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
                                            <option value={opt[0]}>{(opt.length > 1) ? opt[1] : opt[0]}</option>
                                        );
                                    }, table
                                );
            return (
              <td  key={colIndex} className='inline-container' style={cellStyle} >
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
              <td  onClick={selectCells.bind(null, rowIndex, colIndex, rowIndex, colIndex)} key={colIndex} className='inline-container' style={cellStyle} ><span  className={centerClassNames}>{col}</span>
              </td>
            );
        }
    };

    var tableGetDataCellRenderer = getProperty(table, "getDataCellRenderer", null);

    var rowIndex = this.props.rowIndex;

    var renderedCols = this.props.row.map(function(col, index, arr){
        if (isColumnHidden(index, table.state.hiddenColumnRanges))
            return '';

        var dataCellRenderer = null;
        if (tableGetDataCellRenderer != null)
            dataCellRenderer = tableGetDataCellRenderer.get(index);
        if (dataCellRenderer == null)
            dataCellRenderer = defaultDataCellRenderer;
        return dataCellRenderer.call(table, col, index, rowIndex);
        }, table);
    return (
      <tr>
        {renderedCols}
      </tr>
    );
  }
});

var Table = React.createClass({
  getInitialState: function() {
    var initState =
        {
            activeHeaderIndex: -1,
            hiddenColumnRanges: [],
            selectingColumnIndex: -1,
            selectedIndices: [-1, -1, -1, -1]
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
        return (
            <TableDataRow key={rowIndex + 1} table={this} row={row} rowIndex={rowIndex}>
            </TableDataRow>
            );
        }, this
        );
    var tableClassName = getProperty(this.props, 'className', '');
    return (
      <table className={tableClassName}>
        <TableHeader table={this}>
        </TableHeader>
        {renderedRows}
      </table>
    );
  }

});

module.exports = Table;
