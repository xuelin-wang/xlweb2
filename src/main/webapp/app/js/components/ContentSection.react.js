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

var MessageComposer = require('./MessageComposer.react');
var Table = require('./Table.react');
var MessageStore = require('../stores/MessageStore');
var React = require('react');
var Immutable = require('immutable');
var ThreadStore = require('../stores/ThreadStore');

function getStateFromStores() {
  return {
    messages: MessageStore.getAllForCurrentThread(),
    thread: ThreadStore.getCurrent()
  };
}

var ContentSection = React.createClass({

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    MessageStore.addChangeListener(this._onChange);
    ThreadStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    MessageStore.removeChangeListener(this._onChange);
    ThreadStore.removeChangeListener(this._onChange);
  },

  render: function() {
    var tableHeader = ["firsdddddddddt name", "last name", "address", "sex"];
    for (var index = 0; index < 40; index++) {
        tableHeader.push("Column " + index);
    }

    var tablePreheader0 = ['personal info', null, null, null];
    for (var index = 0; index < 40; index++) {
        if (index % 4 == 0)
            tablePreheader0.push('Columns batch ' + (index / 4));
        else
            tablePreheader0.push(null);
    }

    var tablePreheaders = [tablePreheader0];

    var tableData = [];
    var row0 = ['Charles', 'w666666666666666666666666666666666ang', 'abcd efgh', 'M'];
    for (var index = 0; index < 40; index++) {
        row0.push('cell 0 ' + index);
    }
    tableData.push(row0);
    var row1 = ['Tom', 'Bradly', '1234 5ddddddddddddddddddddddddddddddddddddd678', 'M'];
    for (var index = 0; index < 40; index++) {
        row1.push('cell 1 ' + index);
    }
    tableData.push(row1);

    for (var index = 0; index < 40; index++) {
        var prefix = 'cell ' + index + ' ';
        var row = [];
        for (var colIndex = 0; colIndex < 44; colIndex++) {
            row.push(prefix + colIndex);
        }
        tableData.push(row);
    }

    var getCellSpec = function(rowIndex, colIndex){
        if (rowIndex == 1 && colIndex == 4) {
            var spec = {
                type: 'input',
                style: {
                    width: '40px'
                }
            };
            return spec;
        }
        else if (rowIndex == 1 && colIndex == 5) {
            var spec = {
                type: 'select',
                options: [
                  ['cell 1 1a'], ['cell 1 1'], ['cell 1 1b', 'cell 1 1 updated']
                ]
            };
            return spec;
        }
        else if (colIndex == 6) {
            var spec = {
                type: 'input',
                style: {
                    width: '40px'
                }
            };
            return spec;
        }
        else
            return null;
    };

    var rowCount = tableData.length;
    for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        var row = tableData[rowIndex];
        var rowMetadata = {};
        rowMetadata.rowIndex = rowIndex;
        row.splice(0, 0, rowMetadata);
    }
    var tableDataList = Immutable.fromJS(tableData);

    return (
      <div className="content-section">
        <Table preheaders={tablePreheaders} header={tableHeader} data={tableDataList} getCellSpec={getCellSpec}>
        </Table>
      </div>
    );
  },

  componentDidUpdate: function() {
  },

  /**
   * Event handler for 'change' events coming from the MessageStore
   */
  _onChange: function() {
    this.setState(getStateFromStores());
  }

});

module.exports = ContentSection;
