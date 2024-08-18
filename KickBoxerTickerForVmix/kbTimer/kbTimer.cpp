// report-progress.cpp
// compile with: /EHsc
#include <stdio.h>
#include <agents.h>
#include <chrono>
#include <windows.h>
#include <iostream>
#include <string>

namespace ccr = concurrency;
using namespace std;

std::chrono::time_point<std::chrono::system_clock> start_time;
std::chrono::time_point<std::chrono::system_clock> current_time;
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
        ccr::wait(3300);      // Yield the current context for 3300 milliseconds
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
        current_time = std::chrono::system_clock::now();
        auto elapsed_seconds = std::chrono::duration_cast<std::chrono::seconds>(current_time - start_time).count();
        call_sequence += " " + to_string(loop_counter);

        std::chrono::time_point<std::chrono::system_clock> timer_time = start_time + std::chrono::seconds(elapsed_seconds);

        auto start_min = std::chrono::duration_cast<std::chrono::minutes>(timer_time.time_since_epoch()).count() % 60;
        auto start_sec = std::chrono::duration_cast<std::chrono::seconds>(timer_time.time_since_epoch()).count() % 60;

        auto current_min = std::chrono::duration_cast<std::chrono::minutes>(current_time.time_since_epoch()).count() % 60;
        auto current_sec = std::chrono::duration_cast<std::chrono::seconds>(current_time.time_since_epoch()).count() % 60;

        wcout << '\r';
        printf("%02d:%02d", static_cast<int>(start_min), static_cast<int>(start_sec));
        printf("        %3d        ", loop_counter);
        printf("%02d:%02d", static_cast<int>(current_min), static_cast<int>(current_sec));
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
            current_time = std::chrono::system_clock::now();
            start_time = current_time;

            loop_counter = 1;
            call_sequence = "";
            wcout << L"\n\nPerforming a lengthy operation\n\n";
            printf("Timer       LoopNo      SystemTime     Lengthy operation\n");
            progress_timer.start();                                      // Start the timer on a separate context.
            perform_lengthy_operation();                                 // Perform a lengthy operation on the main context.
            progress_timer.stop();                                       // Stop the timer and print a message.

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
