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

var ReactPropTypes = React.PropTypes;

var TableHeader = React.createClass({
  render: function() {
    var table = this.props.table;
    var header = getProperty(table.props, "header", null);
    if (header == null) {
        return (
            <tr><td></td></tr>
        );
    }

    var defaultHeaderCellRenderer = function(col, colIndex) {
        var onMouseOver = function(index) {
            table.setState({activeHeaderIndex: index});
        };
        var onMouseOut = function(index) {
            table.setState({activeHeaderIndex: -1});
        };

        var showDownArrow = (colIndex == table.state.activeHeaderIndex);

        var downArrow = '\u25bc';
        var downMenu;
        if (showDownArrow)
            downMneu = (
            <div className="simple-menu-wrap">
                <nav className="simple-menu">
<ul className="clearfix">
    <li>
        <span className='arrow'>{downArrow}</span>
        <ul className="sub-simple-menu">
            <li><span>Hide Column</span></li>
        </ul>
    </li>
</ul>
</nav></div>
              );
        else
            downMenu = '';

        var showLeftArrow = false;
        var leftArrow = showLeftArrow ? '\u25c0 ' : '';

        var showRightArrow = false;
        var rightArrow = showLeftArrow ? '\u25b6' : '';

        return (
          <td key={colIndex} onMouseOver={onMouseOver.bind(table, colIndex)} onMouseOut={onMouseOut.bind(table, colIndex)} className='inline-container'>
          <span className='leftEdge'>{leftArrow}</span><span className='centerMain'>
          <b>{col}</b>
          </span><span className='rightEdge'>
          {downMenu}</span>
          </td>
        );
    };

    var tableGetHeaderCellRenderer = getProperty(table, "getHeaderCellRenderer", null);

    var renderedCols = header.map(
      function(col, index, arr) {
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
      <tr>
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
    return {activeHeaderIndex: -1};
  },

  render: function() {
    var dataRows = this.props.data;
    var renderedRows =
        dataRows.map(function(row, rowIndex, arr) {
        return (
            <TableDataRow key={rowIndex} table={this} row={row}>
            </TableDataRow>
            );
        }, this
        );
    return (
      <table>
        <TableHeader table={this}>
        </TableHeader>
        {renderedRows}
      </table>
    );
  }

});

module.exports = Table;
