-- Seed data for Rules Configuration Engine
-- This script inserts categories and subfunctions into the database
-- Run this after schema.sql has been executed

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, description) VALUES
('STR', 'String Functions', 'Functions for string manipulation and operations'),
('NUM', 'Number Functions', 'Functions for numeric calculations and operations'),
('DATE', 'Date Functions', 'Functions for date manipulation and formatting'),
('UTIL', 'Utility Functions', 'General utility and helper functions')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- STRING FUNCTIONS
-- ============================================================
INSERT INTO subfunctions (id, name, description, version, function_name, category_id, code, return_type, input_params) VALUES
(2000, 'Find and Replace', 'Finds and replaces text with another text.', 'v1.0', 'STRING_FIND_REPLACE', 'STR',
 'function STRING_FIND_REPLACE(text, find, replaceWith){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof find !== ''string'') return { success:false, error:{code:400,message:''find must be of type String''}}; if(typeof replaceWith !== ''string'') return { success:false, error:{code:400,message:''replaceWith must be of type String''}}; const value = text.split(find).join(replaceWith); return { success: true, value }; } catch(e){ return { success:false, error:{code:500,message:e.message}}; } }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "find", "data_type": "STRING", "mandatory": true}, {"sequence": 3, "name": "replaceWith", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2001, 'Replace All', 'Replaces all occurrences of a substring inside the string.', 'v1.0', 'STRING_REPLACE_ALL', 'STR',
 'function STRING_REPLACE_ALL(text, find, replaceWith){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof find !== ''string'') return { success:false, error:{code:400,message:''find must be of type String''}}; if(typeof replaceWith !== ''string'') return { success:false, error:{code:400,message:''replaceWith must be of type String''}}; const value = text.split(find).join(replaceWith); return { success: true, value }; } catch(e){ return { success:false, error:{code:500,message:e.message}}; } }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "find", "data_type": "STRING", "mandatory": true}, {"sequence": 3, "name": "replaceWith", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2002, 'Substring', 'Returns substring from start index with length.', 'v1.1', 'SUB_STRING', 'STR',
 'function SUB_STRING(inputText, length, start = 0){ try { if(typeof inputText !== ''string'') return { success:false, error:{code:400,message:''inputText must be of type String''}}; if(typeof length !== ''number'' || isNaN(length)) return { success:false, error:{code:400,message:''length must be of type Number''}}; if(start !== undefined && start !== null && (typeof start !== ''number'' || isNaN(start))) return { success:false, error:{code:400,message:''start must be of type Number''}}; if(inputText.length < start){ return { success:false, error:{code:400,message:''Start index greater than string length''}};} const value = inputText.substring(start, start + Number(length)); return { success:true, value }; } catch(e){ return { success:false, error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "inputText", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "length", "data_type": "NUMBER", "mandatory": true}, {"sequence": 3, "name": "start", "data_type": "NUMBER", "mandatory": false, "default_value": 0}]'::jsonb),

(2003, 'To Uppercase', 'Converts text to uppercase.', 'v1.0', 'STRING_UPPER', 'STR',
 'function STRING_UPPER(text){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; return { success:true, value:text.toUpperCase() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2004, 'To Lowercase', 'Converts text to lowercase.', 'v1.0', 'STRING_LOWER', 'STR',
 'function STRING_LOWER(text){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; return { success:true, value:text.toLowerCase() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2005, 'Trim', 'Removes leading and trailing whitespace.', 'v1.0', 'STRING_TRIM', 'STR',
 'function STRING_TRIM(text){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; return { success:true, value:text.trim() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2006, 'Contains', 'Checks whether text contains a substring.', 'v1.0', 'STRING_CONTAINS', 'STR',
 'function STRING_CONTAINS(text, pattern){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof pattern !== ''string'') return { success:false, error:{code:400,message:''pattern must be of type String''}}; return { success:true, value:text.includes(pattern) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "pattern", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2007, 'String Length', 'Returns length of string.', 'v1.0', 'STRING_LENGTH', 'STR',
 'function STRING_LENGTH(text){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; return { success:true, value:text.length }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2008, 'Pad Left', 'Pads string on left side with given character.', 'v1.0', 'STRING_PAD_LEFT', 'STR',
 'function STRING_PAD_LEFT(text, length, char){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof length !== ''number'' || isNaN(length)) return { success:false, error:{code:400,message:''length must be of type Number''}}; if(typeof char !== ''string'') return { success:false, error:{code:400,message:''char must be of type String''}}; return { success:true, value:String(text).padStart(Number(length), char) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "length", "data_type": "NUMBER", "mandatory": true}, {"sequence": 3, "name": "char", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2009, 'Pad Right', 'Pads string on right side with given character.', 'v1.0', 'STRING_PAD_RIGHT', 'STR',
 'function STRING_PAD_RIGHT(text, length, char){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof length !== ''number'' || isNaN(length)) return { success:false, error:{code:400,message:''length must be of type Number''}}; if(typeof char !== ''string'') return { success:false, error:{code:400,message:''char must be of type String''}}; return { success:true, value:String(text).padEnd(Number(length), char) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "length", "data_type": "NUMBER", "mandatory": true}, {"sequence": 3, "name": "char", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2010, 'Replace by Regex', 'Replaces text using regex pattern.', 'v1.0', 'STRING_REGEX_REPLACE', 'STR',
 'function STRING_REGEX_REPLACE(text, pattern, replaceWith){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof pattern !== ''string'') return { success:false, error:{code:400,message:''pattern must be of type String''}}; if(typeof replaceWith !== ''string'') return { success:false, error:{code:400,message:''replaceWith must be of type String''}}; const regex = new RegExp(pattern, ''g''); return { success:true, value:text.replace(regex, replaceWith) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "pattern", "data_type": "STRING", "mandatory": true}, {"sequence": 3, "name": "replaceWith", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2011, 'Split String', 'Splits a string into an array by separator.', 'v1.0', 'STRING_SPLIT', 'STR',
 'function STRING_SPLIT(text, separator){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof separator !== ''string'') return { success:false, error:{code:400,message:''separator must be of type String''}}; return { success:true, value:text.split(separator) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "separator", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2012, 'Starts With', 'Checks if string starts with specified prefix.', 'v1.0', 'STRING_STARTS_WITH', 'STR',
 'function STRING_STARTS_WITH(text, prefix){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof prefix !== ''string'') return { success:false, error:{code:400,message:''prefix must be of type String''}}; return { success:true, value:text.startsWith(prefix) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "prefix", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2013, 'Ends With', 'Checks if string ends with specified suffix.', 'v1.0', 'STRING_ENDS_WITH', 'STR',
 'function STRING_ENDS_WITH(text, suffix){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof suffix !== ''string'') return { success:false, error:{code:400,message:''suffix must be of type String''}}; return { success:true, value:text.endsWith(suffix) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "suffix", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2014, 'Index Of', 'Returns the index of first occurrence of substring.', 'v1.0', 'STRING_INDEX_OF', 'STR',
 'function STRING_INDEX_OF(text, searchValue){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof searchValue !== ''string'') return { success:false, error:{code:400,message:''searchValue must be of type String''}}; return { success:true, value:text.indexOf(searchValue) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "searchValue", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2015, 'Concat Strings', 'Concatenates multiple strings together.', 'v1.0', 'STRING_CONCAT', 'STR',
 'function STRING_CONCAT(str1, str2, str3){ try { if(typeof str1 !== ''string'') return { success:false, error:{code:400,message:''str1 must be of type String''}}; if(typeof str2 !== ''string'') return { success:false, error:{code:400,message:''str2 must be of type String''}}; if(str3 !== undefined && str3 !== null && typeof str3 !== ''string'') return { success:false, error:{code:400,message:''str3 must be of type String''}}; let result = String(str1) + String(str2); if(str3 !== undefined && str3 !== null) result += String(str3); return { success:true, value:result }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "str1", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "str2", "data_type": "STRING", "mandatory": true}, {"sequence": 3, "name": "str3", "data_type": "STRING", "mandatory": false}]'::jsonb),

(2016, 'Repeat String', 'Repeats a string specified number of times.', 'v1.0', 'STRING_REPEAT', 'STR',
 'function STRING_REPEAT(text, count){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof count !== ''number'' || isNaN(count)) return { success:false, error:{code:400,message:''count must be of type Number''}}; return { success:true, value:text.repeat(Number(count)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "count", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(2017, 'Reverse String', 'Reverses the characters in a string.', 'v1.0', 'STRING_REVERSE', 'STR',
 'function STRING_REVERSE(text){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; return { success:true, value:text.split('''').reverse().join('''') }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2018, 'Match Regex', 'Tests if string matches a regex pattern.', 'v1.0', 'STRING_MATCH', 'STR',
 'function STRING_MATCH(text, pattern){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(typeof pattern !== ''string'') return { success:false, error:{code:400,message:''pattern must be of type String''}}; const regex = new RegExp(pattern); return { success:true, value:regex.test(text) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}, {"sequence": 2, "name": "pattern", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2019, 'Capitalize First', 'Capitalizes the first letter of a string.', 'v1.0', 'STRING_CAPITALIZE', 'STR',
 'function STRING_CAPITALIZE(text){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; if(!text) return { success:true, value:'''' }; return { success:true, value:text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}]'::jsonb),

(2020, 'Remove Whitespace', 'Removes all whitespace from a string.', 'v1.0', 'STRING_REMOVE_SPACES', 'STR',
 'function STRING_REMOVE_SPACES(text){ try { if(typeof text !== ''string'') return { success:false, error:{code:400,message:''text must be of type String''}}; return { success:true, value:text.replace(/\\s+/g, '''') }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "text", "data_type": "STRING", "mandatory": true}]'::jsonb)

ON CONFLICT (function_name) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    category_id = EXCLUDED.category_id,
    code = EXCLUDED.code,
    return_type = EXCLUDED.return_type,
    input_params = EXCLUDED.input_params,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- NUMBER FUNCTIONS
-- ============================================================
INSERT INTO subfunctions (id, name, description, version, function_name, category_id, code, return_type, input_params) VALUES
(3001, 'Add Numbers', 'Adds two numbers together.', 'v1.0', 'NUM_ADD', 'NUM',
 'function NUM_ADD(a,b){ try { if(typeof a !== ''number'' || isNaN(a)) return { success:false, error:{code:400,message:''a must be of type Number''}}; if(typeof b !== ''number'' || isNaN(b)) return { success:false, error:{code:400,message:''b must be of type Number''}}; return { success:true, value:Number(a)+Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "a", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "b", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3002, 'Subtract Numbers', 'Subtracts second number from first number.', 'v1.0', 'NUM_SUBTRACT', 'NUM',
 'function NUM_SUBTRACT(a,b){ try { if(typeof a !== ''number'' || isNaN(a)) return { success:false, error:{code:400,message:''a must be of type Number''}}; if(typeof b !== ''number'' || isNaN(b)) return { success:false, error:{code:400,message:''b must be of type Number''}}; return { success:true, value:Number(a)-Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "a", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "b", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3003, 'Multiply Numbers', 'Multiplies two numbers together.', 'v1.0', 'NUM_MULTIPLY', 'NUM',
 'function NUM_MULTIPLY(a,b){ try { if(typeof a !== ''number'' || isNaN(a)) return { success:false, error:{code:400,message:''a must be of type Number''}}; if(typeof b !== ''number'' || isNaN(b)) return { success:false, error:{code:400,message:''b must be of type Number''}}; return { success:true, value:Number(a)*Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "a", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "b", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3004, 'Divide Numbers', 'Divides first number by second number.', 'v1.0', 'NUM_DIVIDE', 'NUM',
 'function NUM_DIVIDE(a,b){ try { if(typeof a !== ''number'' || isNaN(a)) return { success:false, error:{code:400,message:''a must be of type Number''}}; if(typeof b !== ''number'' || isNaN(b)) return { success:false, error:{code:400,message:''b must be of type Number''}}; if(Number(b) === 0) return { success:false, error:{code:400,message:''Division by zero''}}; return { success:true, value:Number(a)/Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "a", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "b", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3005, 'Modulo', 'Returns remainder of division.', 'v1.0', 'NUM_MODULO', 'NUM',
 'function NUM_MODULO(a,b){ try { if(typeof a !== ''number'' || isNaN(a)) return { success:false, error:{code:400,message:''a must be of type Number''}}; if(typeof b !== ''number'' || isNaN(b)) return { success:false, error:{code:400,message:''b must be of type Number''}}; if(Number(b) === 0) return { success:false, error:{code:400,message:''Modulo by zero''}}; return { success:true, value:Number(a)%Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "a", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "b", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3006, 'Power', 'Raises first number to the power of second number.', 'v1.0', 'NUM_POWER', 'NUM',
 'function NUM_POWER(base,exponent){ try { if(typeof base !== ''number'' || isNaN(base)) return { success:false, error:{code:400,message:''base must be of type Number''}}; if(typeof exponent !== ''number'' || isNaN(exponent)) return { success:false, error:{code:400,message:''exponent must be of type Number''}}; return { success:true, value:Math.pow(Number(base), Number(exponent)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "base", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "exponent", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3007, 'Square Root', 'Returns square root of a number.', 'v1.0', 'NUM_SQRT', 'NUM',
 'function NUM_SQRT(num){ try { if(typeof num !== ''number'' || isNaN(num)) return { success:false, error:{code:400,message:''num must be of type Number''}}; if(Number(num) < 0) return { success:false, error:{code:400,message:''Cannot calculate square root of negative number''}}; return { success:true, value:Math.sqrt(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "num", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3008, 'Absolute Value', 'Returns absolute value of a number.', 'v1.0', 'NUM_ABS', 'NUM',
 'function NUM_ABS(num){ try { if(typeof num !== ''number'' || isNaN(num)) return { success:false, error:{code:400,message:''num must be of type Number''}}; return { success:true, value:Math.abs(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "num", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3009, 'Round Number', 'Rounds a number to nearest integer.', 'v1.0', 'NUM_ROUND', 'NUM',
 'function NUM_ROUND(num){ try { if(typeof num !== ''number'' || isNaN(num)) return { success:false, error:{code:400,message:''num must be of type Number''}}; return { success:true, value:Math.round(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "num", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3010, 'Floor', 'Rounds down to nearest integer.', 'v1.0', 'NUM_FLOOR', 'NUM',
 'function NUM_FLOOR(num){ try { if(typeof num !== ''number'' || isNaN(num)) return { success:false, error:{code:400,message:''num must be of type Number''}}; return { success:true, value:Math.floor(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "num", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3011, 'Ceiling', 'Rounds up to nearest integer.', 'v1.0', 'NUM_CEIL', 'NUM',
 'function NUM_CEIL(num){ try { if(typeof num !== ''number'' || isNaN(num)) return { success:false, error:{code:400,message:''num must be of type Number''}}; return { success:true, value:Math.ceil(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "num", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3012, 'Maximum', 'Returns the larger of two numbers.', 'v1.0', 'NUM_MAX', 'NUM',
 'function NUM_MAX(a,b){ try { if(typeof a !== ''number'' || isNaN(a)) return { success:false, error:{code:400,message:''a must be of type Number''}}; if(typeof b !== ''number'' || isNaN(b)) return { success:false, error:{code:400,message:''b must be of type Number''}}; return { success:true, value:Math.max(Number(a), Number(b)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "a", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "b", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3013, 'Minimum', 'Returns the smaller of two numbers.', 'v1.0', 'NUM_MIN', 'NUM',
 'function NUM_MIN(a,b){ try { if(typeof a !== ''number'' || isNaN(a)) return { success:false, error:{code:400,message:''a must be of type Number''}}; if(typeof b !== ''number'' || isNaN(b)) return { success:false, error:{code:400,message:''b must be of type Number''}}; return { success:true, value:Math.min(Number(a), Number(b)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "a", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "b", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3014, 'Random Number', 'Generates random number between min and max.', 'v1.0', 'NUM_RANDOM', 'NUM',
 'function NUM_RANDOM(min, max){ try { if(typeof min !== ''number'' || isNaN(min)) return { success:false, error:{code:400,message:''min must be of type Number''}}; if(typeof max !== ''number'' || isNaN(max)) return { success:false, error:{code:400,message:''max must be of type Number''}}; const minNum = Number(min); const maxNum = Number(max); return { success:true, value:Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "min", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "max", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(3015, 'To Fixed Decimal', 'Formats number to fixed decimal places.', 'v1.0', 'NUM_TO_FIXED', 'NUM',
 'function NUM_TO_FIXED(num, decimals){ try { if(typeof num !== ''number'' || isNaN(num)) return { success:false, error:{code:400,message:''num must be of type Number''}}; if(typeof decimals !== ''number'' || isNaN(decimals)) return { success:false, error:{code:400,message:''decimals must be of type Number''}}; return { success:true, value:Number(num).toFixed(Number(decimals)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "num", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "decimals", "data_type": "NUMBER", "mandatory": true}]'::jsonb)

ON CONFLICT (function_name) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    category_id = EXCLUDED.category_id,
    code = EXCLUDED.code,
    return_type = EXCLUDED.return_type,
    input_params = EXCLUDED.input_params,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- DATE FUNCTIONS
-- ============================================================
INSERT INTO subfunctions (id, name, description, version, function_name, category_id, code, return_type, input_params) VALUES
(4001, 'Add Months', 'Adds specified number of months to a date.', 'v1.0', 'DATE_ADD_MONTHS', 'DATE',
 'function DATE_ADD_MONTHS(dateStr, months){ try { if(!(dateStr instanceof Date) && (typeof dateStr !== ''string'' || isNaN(Date.parse(dateStr)))) return { success:false, error:{code:400,message:''dateStr must be of type Date''}}; if(typeof months !== ''number'' || isNaN(months)) return { success:false, error:{code:400,message:''months must be of type Number''}}; const d = new Date(dateStr); d.setMonth(d.getMonth() + Number(months)); return { success:true, value:d }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'DATE',
 '[{"sequence": 1, "name": "dateStr", "data_type": "DATE", "mandatory": true}, {"sequence": 2, "name": "months", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(4002, 'Format Chinese Date', 'Formats date in Chinese format (生产日期：YYYY年MM月DD日).', 'v1.0', 'FORMAT_DATE_CN', 'DATE',
 E'function FORMAT_DATE_CN(dateValue){ try { if(!(dateValue instanceof Date) && (typeof dateValue !== ''string'' || isNaN(Date.parse(dateValue)))) return { success:false, error:{code:400,message:''dateValue must be of type Date''}}; const d = new Date(dateValue); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,''0''); const dd = String(d.getDate()).padStart(2,''0''); return { success:true, value:`生产日期：${yyyy}年${mm}月${dd}日` }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "dateValue", "data_type": "DATE", "mandatory": true}]'::jsonb),

(4003, 'Add Days', 'Adds specified number of days to a date.', 'v1.0', 'DATE_ADD_DAYS', 'DATE',
 'function DATE_ADD_DAYS(dateStr, days){ try { if(!(dateStr instanceof Date) && (typeof dateStr !== ''string'' || isNaN(Date.parse(dateStr)))) return { success:false, error:{code:400,message:''dateStr must be of type Date''}}; if(typeof days !== ''number'' || isNaN(days)) return { success:false, error:{code:400,message:''days must be of type Number''}}; const d = new Date(dateStr); d.setDate(d.getDate() + Number(days)); return { success:true, value:d }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'DATE',
 '[{"sequence": 1, "name": "dateStr", "data_type": "DATE", "mandatory": true}, {"sequence": 2, "name": "days", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(4004, 'Add Years', 'Adds specified number of years to a date.', 'v1.0', 'DATE_ADD_YEARS', 'DATE',
 'function DATE_ADD_YEARS(dateStr, years){ try { if(!(dateStr instanceof Date) && (typeof dateStr !== ''string'' || isNaN(Date.parse(dateStr)))) return { success:false, error:{code:400,message:''dateStr must be of type Date''}}; if(typeof years !== ''number'' || isNaN(years)) return { success:false, error:{code:400,message:''years must be of type Number''}}; const d = new Date(dateStr); d.setFullYear(d.getFullYear() + Number(years)); return { success:true, value:d }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'DATE',
 '[{"sequence": 1, "name": "dateStr", "data_type": "DATE", "mandatory": true}, {"sequence": 2, "name": "years", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(4005, 'Format Date', 'Formats date to YYYY-MM-DD format.', 'v1.0', 'DATE_FORMAT', 'DATE',
 E'function DATE_FORMAT(dateValue){ try { if(!(dateValue instanceof Date) && (typeof dateValue !== ''string'' || isNaN(Date.parse(dateValue)))) return { success:false, error:{code:400,message:''dateValue must be of type Date''}}; const d = new Date(dateValue); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,''0''); const dd = String(d.getDate()).padStart(2,''0''); return { success:true, value:`${yyyy}-${mm}-${dd}` }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "dateValue", "data_type": "DATE", "mandatory": true}]'::jsonb),

(4006, 'Get Year', 'Extracts year from date.', 'v1.0', 'DATE_GET_YEAR', 'DATE',
 'function DATE_GET_YEAR(dateValue){ try { if(!(dateValue instanceof Date) && (typeof dateValue !== ''string'' || isNaN(Date.parse(dateValue)))) return { success:false, error:{code:400,message:''dateValue must be of type Date''}}; const d = new Date(dateValue); return { success:true, value:d.getFullYear() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "dateValue", "data_type": "DATE", "mandatory": true}]'::jsonb),

(4007, 'Get Month', 'Extracts month from date (1-12).', 'v1.0', 'DATE_GET_MONTH', 'DATE',
 'function DATE_GET_MONTH(dateValue){ try { if(!(dateValue instanceof Date) && (typeof dateValue !== ''string'' || isNaN(Date.parse(dateValue)))) return { success:false, error:{code:400,message:''dateValue must be of type Date''}}; const d = new Date(dateValue); return { success:true, value:d.getMonth() + 1 }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "dateValue", "data_type": "DATE", "mandatory": true}]'::jsonb),

(4008, 'Get Day', 'Extracts day from date.', 'v1.0', 'DATE_GET_DAY', 'DATE',
 'function DATE_GET_DAY(dateValue){ try { if(!(dateValue instanceof Date) && (typeof dateValue !== ''string'' || isNaN(Date.parse(dateValue)))) return { success:false, error:{code:400,message:''dateValue must be of type Date''}}; const d = new Date(dateValue); return { success:true, value:d.getDate() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "dateValue", "data_type": "DATE", "mandatory": true}]'::jsonb),

(4009, 'Date Difference in Days', 'Calculates difference between two dates in days.', 'v1.0', 'DATE_DIFF_DAYS', 'DATE',
 'function DATE_DIFF_DAYS(date1, date2){ try { if(!(date1 instanceof Date) && (typeof date1 !== ''string'' || isNaN(Date.parse(date1)))) return { success:false, error:{code:400,message:''date1 must be of type Date''}}; if(!(date2 instanceof Date) && (typeof date2 !== ''string'' || isNaN(Date.parse(date2)))) return { success:false, error:{code:400,message:''date2 must be of type Date''}}; const d1 = new Date(date1); const d2 = new Date(date2); const diffTime = Math.abs(d2 - d1); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return { success:true, value:diffDays }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "date1", "data_type": "DATE", "mandatory": true}, {"sequence": 2, "name": "date2", "data_type": "DATE", "mandatory": true}]'::jsonb),

(4010, 'Get Current Date', 'Returns current date and time.', 'v1.0', 'DATE_NOW', 'DATE',
 'function DATE_NOW(){ try { return { success:true, value:new Date() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'DATE',
 '[]'::jsonb),

(4011, 'Is Valid Date', 'Checks if value is a valid date.', 'v1.0', 'DATE_IS_VALID', 'DATE',
 'function DATE_IS_VALID(dateValue){ try { const d = new Date(dateValue); return { success:true, value:!isNaN(d.getTime()) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "dateValue", "data_type": "ANY", "mandatory": true}]'::jsonb)

ON CONFLICT (function_name) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    category_id = EXCLUDED.category_id,
    code = EXCLUDED.code,
    return_type = EXCLUDED.return_type,
    input_params = EXCLUDED.input_params,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================
INSERT INTO subfunctions (id, name, description, version, function_name, category_id, code, return_type, input_params) VALUES
(5001, 'Is Empty', 'Checks if a value is empty (null, undefined, or empty string).', 'v1.0', 'IS_EMPTY', 'UTIL',
 'function IS_EMPTY(value){ return { success:true, value:(value === null || value === undefined || value === '''') }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5002, 'Is Null', 'Checks if a value is null.', 'v1.0', 'IS_NULL', 'UTIL',
 'function IS_NULL(value){ return { success:true, value:value === null }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5003, 'Is Number', 'Checks if a value is a number.', 'v1.0', 'IS_NUMBER', 'UTIL',
 'function IS_NUMBER(value){ return { success:true, value:typeof value === ''number'' && !isNaN(value) }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5004, 'Is String', 'Checks if a value is a string.', 'v1.0', 'IS_STRING', 'UTIL',
 'function IS_STRING(value){ return { success:true, value:typeof value === ''string'' }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5005, 'Is Boolean', 'Checks if a value is a boolean.', 'v1.0', 'IS_BOOLEAN', 'UTIL',
 'function IS_BOOLEAN(value){ return { success:true, value:typeof value === ''boolean'' }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5006, 'To String', 'Converts any value to string.', 'v1.0', 'TO_STRING', 'UTIL',
 'function TO_STRING(value){ try { return { success:true, value:String(value) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'STRING',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5007, 'To Number', 'Converts value to number.', 'v1.0', 'TO_NUMBER', 'UTIL',
 'function TO_NUMBER(value){ try { const num = Number(value); if(isNaN(num)) return { success:false, error:{code:400,message:''Cannot convert to number''}}; return { success:true, value:num }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'NUMBER',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5008, 'To Boolean', 'Converts value to boolean.', 'v1.0', 'TO_BOOLEAN', 'UTIL',
 'function TO_BOOLEAN(value){ try { return { success:true, value:Boolean(value) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5009, 'Default Value', 'Returns default value if input is empty/null.', 'v1.0', 'DEFAULT_VALUE', 'UTIL',
 'function DEFAULT_VALUE(value, defaultVal){ try { return { success:true, value:(value === null || value === undefined || value === '''') ? defaultVal : value }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }',
 'ANY',
 '[{"sequence": 1, "name": "value", "data_type": "ANY", "mandatory": true}, {"sequence": 2, "name": "defaultVal", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5010, 'Equals', 'Checks if two values are equal.', 'v1.0', 'EQUALS', 'UTIL',
 'function EQUALS(value1, value2){ return { success:true, value:value1 === value2 }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value1", "data_type": "ANY", "mandatory": true}, {"sequence": 2, "name": "value2", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5011, 'Not Equals', 'Checks if two values are not equal.', 'v1.0', 'NOT_EQUALS', 'UTIL',
 'function NOT_EQUALS(value1, value2){ return { success:true, value:value1 !== value2 }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value1", "data_type": "ANY", "mandatory": true}, {"sequence": 2, "name": "value2", "data_type": "ANY", "mandatory": true}]'::jsonb),

(5012, 'Greater Than', 'Checks if first value is greater than second.', 'v1.0', 'GREATER_THAN', 'UTIL',
 'function GREATER_THAN(value1, value2){ if(typeof value1 !== ''number'' || isNaN(value1)) return { success:false, error:{code:400,message:''value1 must be of type Number''}}; if(typeof value2 !== ''number'' || isNaN(value2)) return { success:false, error:{code:400,message:''value2 must be of type Number''}}; return { success:true, value:Number(value1) > Number(value2) }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value1", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "value2", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(5013, 'Less Than', 'Checks if first value is less than second.', 'v1.0', 'LESS_THAN', 'UTIL',
 'function LESS_THAN(value1, value2){ if(typeof value1 !== ''number'' || isNaN(value1)) return { success:false, error:{code:400,message:''value1 must be of type Number''}}; if(typeof value2 !== ''number'' || isNaN(value2)) return { success:false, error:{code:400,message:''value2 must be of type Number''}}; return { success:true, value:Number(value1) < Number(value2) }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value1", "data_type": "NUMBER", "mandatory": true}, {"sequence": 2, "name": "value2", "data_type": "NUMBER", "mandatory": true}]'::jsonb),

(5014, 'Logical AND', 'Returns true if both values are true.', 'v1.0', 'AND', 'UTIL',
 'function AND(value1, value2){ if(typeof value1 !== ''boolean'') return { success:false, error:{code:400,message:''value1 must be of type Boolean''}}; if(typeof value2 !== ''boolean'') return { success:false, error:{code:400,message:''value2 must be of type Boolean''}}; return { success:true, value:Boolean(value1) && Boolean(value2) }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value1", "data_type": "BOOLEAN", "mandatory": true}, {"sequence": 2, "name": "value2", "data_type": "BOOLEAN", "mandatory": true}]'::jsonb),

(5015, 'Logical OR', 'Returns true if at least one value is true.', 'v1.0', 'OR', 'UTIL',
 'function OR(value1, value2){ if(typeof value1 !== ''boolean'') return { success:false, error:{code:400,message:''value1 must be of type Boolean''}}; if(typeof value2 !== ''boolean'') return { success:false, error:{code:400,message:''value2 must be of type Boolean''}}; return { success:true, value:Boolean(value1) || Boolean(value2) }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value1", "data_type": "BOOLEAN", "mandatory": true}, {"sequence": 2, "name": "value2", "data_type": "BOOLEAN", "mandatory": true}]'::jsonb),

(5016, 'Logical NOT', 'Returns opposite boolean value.', 'v1.0', 'NOT', 'UTIL',
 'function NOT(value){ if(typeof value !== ''boolean'') return { success:false, error:{code:400,message:''value must be of type Boolean''}}; return { success:true, value:!Boolean(value) }; }',
 'BOOLEAN',
 '[{"sequence": 1, "name": "value", "data_type": "BOOLEAN", "mandatory": true}]'::jsonb)

ON CONFLICT (function_name) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    category_id = EXCLUDED.category_id,
    code = EXCLUDED.code,
    return_type = EXCLUDED.return_type,
    input_params = EXCLUDED.input_params,
    updated_at = CURRENT_TIMESTAMP;

-- Reset the subfunctions sequence to continue from the highest ID
SELECT setval('subfunctions_id_seq', (SELECT MAX(id) FROM subfunctions));
