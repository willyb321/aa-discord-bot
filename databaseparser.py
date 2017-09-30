#run this with crontab every 5 minutes

import os
import sys
import re
import urllib
import tempfile
import json
from xlrd import open_workbook # for loading XLSXs

if os.path.exists(os.path.join(tempfile.gettempdir(),"database.xlsx")):
	os.remove(os.path.join(tempfile.gettempdir(),"database.xlsx"))
urllib.urlretrieve("https://docs.google.com/spreadsheets/d/e/2PACX-1vQoQAFNSyO8be8rFZt2ynzygeP0tCQbUiJdG6ZoEuXoDawSls6VahUDCjDBIWtVJYwvhQbQahXx9S-y/pub?output=xlsx", os.path.join(tempfile.gettempdir(),"database.xlsx"))

book = open_workbook(os.path.join(tempfile.gettempdir(),"database.xlsx"))
database = {}
for sheetName in book.sheet_names():
	sheet = book.sheet_by_name(sheetName)
	keys = [sheet.cell(0, col_index).value for col_index in xrange(sheet.ncols)]
	dict_list = []
	for row_index in xrange(1, sheet.nrows):
		d = {keys[col_index]: sheet.cell(row_index, col_index).value 
		for col_index in xrange(sheet.ncols)}
		dict_list.append(d)
	database[sheetName] = dict_list
print json.dumps(database)
