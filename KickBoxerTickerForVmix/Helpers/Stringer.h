#pragma once

#include <string>

class Stringer
{
private:
    static std::string wsp;

public:

    /** @brief Left and Right spaces trimmer.
    *   @param str : string to trim
    *   @return trimmed string
    */
    static std::string ltrimRtrim(std::string str);

    /** @brief Reduce consecutive spaces (between 'words') to single space.
    *   Space (0x20) and Tab (0x9) are detecting.
    *   All tabs converts to spaces.
    *   @param str : string to reduce spaces
    *   @return reduced string
    */
    static std::string singleWhitespaces(std::string str);

    /**
     * @brief Convert each char in charbuf to their codes
     * @param charbuf 
     * @param charbuf_len 
     * @param unprintable_only if true (default) - only chars with 0-31 codes will be converted to its codes. if false - all chars will be converted to its codes
     * @return string with space separated codes
     */
    static std::string charBufToCharCodes(char* charbuf, int charbuf_len, bool unprintable_only = true);

};
