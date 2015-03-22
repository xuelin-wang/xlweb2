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
        var hideColumn = function(){
            var newHiddenRanges = table.state.hiddenColumnRanges.slice(0);
            addHiddenColumn(colIndex, colIndex, newHiddenRanges);
            table.setState(
            {
                hiddenColumnRanges: newHiddenRanges
            }
            );
        };
        var downArrowButton = (
            <DropdownButton bsStyle='link' className='header-down-size' title='' key={0}>
                <MenuItem onClick={hideColumn}>Hide Column</MenuItem>
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

        return (
          <td key={colIndex} onMouseOver={onMouseOver.bind(table, colIndex)} onMouseOut={onMouseOut.bind(table, colIndex)} className='inline-container'>
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

var TableDataRow = React.createClass({
  render: function() {
    var table = this.props.table;

    var defaultDataCellRenderer = function(col, colIndex) {
        return (
          <td  key={colIndex} className='inline-container'><span className='leftEdge'> </span><span  className='centerMain'>{col}</span>
         <span className='rightEdge'></span>
          </td>
        );
    };

    var tableGetDataCellRenderer = getProperty(table, "getDataCellRenderer", null);

    var renderedCols = this.props.row.map(function(col, index, arr){
        if (isColumnHidden(index, table.state.hiddenColumnRanges))
            return '';

        var dataCellRenderer = null;
        if (tableGetDataCellRenderer != null)
            dataCellRenderer = tableGetDataCellRenderer.get(index);
        if (dataCellRenderer == null)
            dataCellRenderer = defaultDataCellRenderer;
        return dataCellRenderer.call(table, col, index);
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
    var initState = {activeHeaderIndex: -1, hiddenColumnRanges: []};
    return initState;
  },

  render: function() {
    var dataRows = this.props.data;
    var renderedRows =
        dataRows.map(function(row, rowIndex, arr) {
        return (
            <TableDataRow key={rowIndex + 1} table={this} row={row}>
            </TableDataRow>
            );
        }, this
        );
    var tableClassName = 'xlTable';
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
