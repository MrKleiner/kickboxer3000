#include "Stringer.h"

using namespace std;

string Stringer::ltrimRtrim(string str) {
    // Match whitespaces
    const regex trim_pattern(R"(^[\s]+|[\s]+$)");

    return regex_replace(str, trim_pattern, "");
}

string Stringer::singleWhitespaces(string str) {
    // Match multiple whitespace characters
    const regex ws_pattern(R"([\s]+)");

    return regex_replace(str, ws_pattern, " ");
}

string Stringer::charBufToCharCodes(char * charbuf, int charbuf_len, bool nonprintable_only) {
    std::ostringstream s; // reduce unnecessary appends and use stream instead
    for (int i = 0; i < charbuf_len; i++) {
        if (!nonprintable_only || charbuf[i] < 32) {
            s << "{{" << std::to_string(static_cast<unsigned char>(charbuf[i])) << "}} ";
        }
        else {
            s << charbuf[i] << ' ';
        }
    }
    return s.str();
}
