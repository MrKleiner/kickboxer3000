#pragma once
#include <iostream>
#include <thread>
#include "KbTickerThreadedClass.h"

using namespace std;

class KbShowTickersStatuses
{
private:
    array<KbTickerThreadedClass, 16>* tickers;
    std::thread separate_thread_for_ticker_statuses_update;
    bool stopThreadFlag = true;
    bool* do_not_show_current_time_;

public:
    KbShowTickersStatuses(bool* ptr, array<KbTickerThreadedClass, 16>* t) : do_not_show_current_time_(ptr), tickers(t) {};

    void startThread() {
        stopThreadFlag = false;
        separate_thread_for_ticker_statuses_update = std::thread(&KbShowTickersStatuses::threadFunction, this);
    }

    void stopThreadFunction() {
        stopThreadFlag = true;
        if (separate_thread_for_ticker_statuses_update.joinable()) {
            separate_thread_for_ticker_statuses_update.join();
        }
    }

    bool isThreadActive() const {
        return separate_thread_for_ticker_statuses_update.joinable();
    }


private:

    void per_second_updates() {
        if (!*do_not_show_current_time_) {
            for (size_t i = 1; i < tickers->size(); i++)                 // for (const auto& obj : tickers* )
                if ( tickers->at(i).ticker_no > 0 ) 
                    cout << "\rLast sent " << "\033[" << 9 + tickers->at(i).ticker_no * 8 << "G" << to_string(tickers->at(i).last_sent_mm) << ':' << to_string(tickers->at(i).last_sent_ss) << "   ";
        }
    }

    void threadFunction() {
        std::chrono::time_point<std::chrono::system_clock> next_time_ = chrono::system_clock::now();
        next_time_ += 1s;
        while (!stopThreadFlag) {
            std::this_thread::sleep_until(next_time_);
            if (!stopThreadFlag) {
                per_second_updates();
                next_time_ += 1s;
            }
        }
    }


};

