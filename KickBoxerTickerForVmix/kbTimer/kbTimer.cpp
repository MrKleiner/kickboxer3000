// report-progress.cpp
// compile with: /EHsc
#include <stdio.h>
#include <agents.h>
#include <time.h>
#include <windows.h>
#include <iostream>
#include <chrono>
#include <string>


namespace ccr = concurrency; // using namespace ccr; using namespace concurrency
using namespace std;



__time64_t long_start_time;
__time64_t long_current_time;
struct tm tm_timer_time;
struct tm tm_current_time;
errno_t err;
uint32_t loop_counter;
string call_sequence;


/**
* Ctrl-C handler (trap)
*/
BOOL WINAPI CtrlHandler(DWORD fdwCtrlType)
{
    switch (fdwCtrlType)
    {
    case CTRL_C_EVENT: case CTRL_CLOSE_EVENT: case CTRL_BREAK_EVENT:
        printf("\n\nCtrl- event code (return true): %d\n\n", fdwCtrlType);
        Beep(500, 300);
        return FALSE;
    
    case CTRL_LOGOFF_EVENT: case CTRL_SHUTDOWN_EVENT: default:
        Beep(750, 500);
        printf("\n\nCtrl- event code (return false): %d\n\n", fdwCtrlType);
        return TRUE;
    }
}


/**
* Simulates a lengthy operation.
*/
void perform_lengthy_operation()
{
    call_sequence += ">>> " + to_string(loop_counter) + " <<<   ";
    for (int i = 1; i <= 10; i++) {
        // for (uint64_t i = 0; i < 3000000000; i++) { __nop(); };
        ccr::wait(3300);      // Yield the current context for XXXX milliseconds
        printf("          >>>%d<<<", loop_counter);
        loop_counter++;
    }
}


int main()
{
    /*
    * Create a call object that prints a single character to the console.
    */
    ccr::call<wchar_t> report_progress([](wchar_t c) {
        _time64(&long_current_time);                                // Get current time as 64-bit integer.
        err = _localtime64_s(&tm_current_time, &long_current_time); // Convert to local time
        long_start_time++;                                          // Increment start time for 1 second    
        call_sequence += " " + to_string(loop_counter);
        _localtime64_s(&tm_timer_time, &long_start_time);           // Convert to local time

        wcout << char(0xD);
        printf("%02d:%02d", tm_timer_time.tm_min, tm_timer_time.tm_sec);
        // wcout << newtime.tm_min << ":" << newtime.tm_sec;
        printf("        %3d        ", loop_counter);
        printf("%02d:%02d", tm_current_time.tm_min, tm_current_time.tm_sec); // , call_sequence.data()
    }); 





    if (SetConsoleCtrlHandler(CtrlHandler, TRUE))
    {
        printf("\n   ---     The Control Handler is installed.     ---\n");
        printf("   ---   Now try pressing Ctrl+C or Ctrl+Break   ---\n\n");
        
        while (1) {
            /*
             * Create a timer object that sends the dot character to the call object every 1000 milliseconds.
            */
            ccr::timer<wchar_t> progress_timer(1000, L'.', &report_progress, true);
            /*
            * Get current system time and store it in global var
            */
            _time64(&long_current_time);                                 // Get time as 64-bit integer.
            err = _localtime64_s(&tm_current_time, &long_current_time);  // Convert to local time.
            if (err)
            { printf("Invalid argument to _localtime64_s."); exit(1); }
            long_start_time = long_current_time;                         // Save start time
            /**/
            
            loop_counter = 1;
            call_sequence = "";
            wcout << L"\n\nPerforming a lengthy operation\n\n";
            printf("Timer       LoopNo      SystemTime     Lengthy operation\n");
            progress_timer.start();                                      // Start the timer on a separate context.
            perform_lengthy_operation();                                 // Perform a lengthy operation on the main context.
            progress_timer.stop();                                       // Stop the timer and print a message.
            // progress_timer.~timer();
            wcout << L"\n\n\n\n\n\n";
        }
    }
    else
    {
        printf("\nERROR: Could not set Control- handler (trap)");
        return 1;
    }

    wcout << L"\n\ndone.\n";
    return 0;
}
