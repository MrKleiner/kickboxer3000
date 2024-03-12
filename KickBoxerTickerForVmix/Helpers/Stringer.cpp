#include "Stringer.h"
#include <format>

using namespace std;

string Stringer::wsp = " \t"; // space and tab

// TODO - regex variation (std::regex)
string Stringer::ltrimRtrim(string str) {
    // Initialize considering no trimming required.
    int64_t atstart = 0, atend = str.size() - 1;

    // Spaces at start
    for (size_t i = 0; i < str.size(); i++)
        if (wsp.find(str[i]) == std::string::npos) { atstart = i; break; }
    // if (str[i] != ' ') { atstart = i; break; }

// Spaced from end

    for (int64_t i = str.size() - 1; i >= 0; i--)
        if (wsp.find(str[i]) == std::string::npos) { atend = i; break; }
    //if (str[i] != ' ') { atend = i; break; }

    string fistr = "";
    for (int64_t i = atstart; i <= atend; i++) fistr += str[i];

    return fistr;
}

// TODO - regex variation (std::regex)
string Stringer::singleWhitespaces(string str) {
    string fistr = "";
    // Last str[i + 1] will be "first char after end of string". It's always 0. So last symbol in string will not be lost
    for (int64_t i = 0; i < int64_t(str.size()); i++)
        if (!(wsp.find(str[i]) != std::string::npos && wsp.find(str[i + 1]) != std::string::npos))
            fistr += (str[i] == char(9)) ? ' ' : str[i];
    return fistr;
}


string Stringer::charBufToCharCodes(char * charbuf, int charbuf_len, bool nonprintable_only) {
    string s = "";
    if (nonprintable_only) {
        for (int i = 0; i < charbuf_len; i++)
            s += (charbuf[i] < 32) ? "{{" + to_string(charbuf[i]) + "}} " : std::format("{} ", charbuf[i]);
    }
    else { 
        for (int i = 0; i < charbuf_len; i++)
            s += "{{" + to_string(charbuf[i]) + "}} ";
    }
    return s;
}
