#pragma once

#include <iostream>
#include <thread>
#include <chrono>
#include "KbUdpPacketHeaders.h"
#include "KbTickerReceivers.h"

//#include <mutex>
//#include <condition_variable>
#include <atomic>
#include <format>
#include <iostream>

using namespace std;


class KbTickerThreadedClass {


private:
    thread separate_thread_for_timer;
    bool stopThreadFlag = true;
    SendTimerUdpPacketHeader udp_pkt_buf;
    bool* do_not_show_current_time_;

public:
    uint8_t           ticker_no    = 0;
    uint8_t           start_mins_  = 0;
    uint8_t           start_secs_  = 0;
    uint8_t           end_mins_    = 0;
    uint8_t           end_secs_    = 0;
    uint8_t           last_sent_mm = 0; // atomic_uint8_t?
    uint8_t           last_sent_ss = 0; // atomic_uint8_t?
    KbTickerReceivers udp_tcp_per_second_receivers;
    KbTickerReceivers udp_tcp_end_time_receivers;


    KbTickerThreadedClass(bool* ptr) : do_not_show_current_time_(ptr) {}


    void stopTickerAndClearAllReceivers() {
        stopThreadFunction();
        udp_tcp_per_second_receivers.clearAllReceivers();
        udp_tcp_end_time_receivers.clearAllReceivers();
        ticker_no = start_mins_ = start_secs_ = end_mins_ = end_secs_ = last_sent_mm = last_sent_ss = 0;

    }


    void startThread(uint8_t start_mins, uint8_t start_secs, uint8_t end_mins, uint8_t end_secs) {
        start_mins_ = start_mins;
        start_secs_ = start_secs;
        end_mins_   = end_mins;
        end_secs_   = end_secs;
        stopThreadFlag = false;  // Reset the flag
        if (start_mins_*60+ start_secs_ < end_mins_*60+ end_secs_) {
            separate_thread_for_timer = thread(&KbTickerThreadedClass::threadFunctionIncrease, this);
        }
        else {
            separate_thread_for_timer = thread(&KbTickerThreadedClass::threadFunctionDecrease, this);
        }
        
    }


    void resumeThread() {
        if (ticker_no > 0) {
            if ( isThreadActive() )
                cout << "Ticker # " << ticker_no << "already active";
            else {
                startThread(last_sent_mm, last_sent_ss, end_mins_, end_secs_);
            }
        }
    }


    void stopThreadFunction() {
        stopThreadFlag = true;
        if (separate_thread_for_timer.joinable())
            separate_thread_for_timer.join();
    }


    void threadFunctionIncrease() {
        chrono::time_point<chrono::system_clock> start_time_;
        chrono::time_point<chrono::system_clock> end_time_;
        chrono::time_point<chrono::system_clock> next_time_;

        start_time_  = chrono::system_clock::now(); // chrono::floor<chrono::seconds>()
        next_time_   = start_time_;
        start_time_ -= 1s * (60 * start_mins_);
        start_time_ -= 1s * start_secs_;
        end_time_ = start_time_;
        end_time_   += 1s * (60 * end_mins_);
        end_time_   += 1s * end_secs_;
        chrono::time_point<chrono::system_clock> breakpoint_time_;

        next_time_ += 1s;
        while (!stopThreadFlag) {
            this_thread::sleep_until(next_time_);
            if (!stopThreadFlag) {
                if ( next_time_ <= end_time_ ) {
                    // not end time
                    per_second_updates(next_time_, start_time_);
                    breakpoint_time_ = chrono::system_clock::now(); // chrono::floor<chrono::seconds>()
                    next_time_ += 1s;
                    if (next_time_ <= breakpoint_time_)
                        next_time_ = breakpoint_time_ + 1s; // next_time_ <= breakpoint_time_ mean trouble occures (in most cases ticker was suspended by user and/or by system)
                    
                } else {
                    // end time
                    // 1. send udp packet (inform controller)
                    // 2. stop http-get requests to vmix
                    // 3. stop udp sends to controller
                    stopThreadFlag = true;
                    for (const auto& obj : udp_tcp_end_time_receivers.ticker_receivers)
                        obj->sendPacketMMSS(last_sent_mm, last_sent_ss, ticker_no);
                }
            }
        }
    }


    void threadFunctionDecrease() {
        chrono::time_point<chrono::system_clock> start_time_;
        chrono::time_point<chrono::system_clock> end_time_;
        chrono::time_point<chrono::system_clock> next_time_;

        start_time_ = chrono::system_clock::now(); // chrono::floor<chrono::seconds>()
        next_time_ = start_time_;
        start_time_ += 1s * (60 * start_mins_);
        start_time_ += 1s * start_secs_;
        end_time_ = start_time_;
        end_time_ -= 1s * (60 * end_mins_);
        end_time_ -= 1s * end_secs_;
        chrono::time_point<chrono::system_clock> breakpoint_time_;

        next_time_ += 1s;
        while (!stopThreadFlag) {
            this_thread::sleep_until(next_time_);
            if (!stopThreadFlag) {
                if (next_time_ <= end_time_) {
                    // not end time
                    per_second_updates_decrease(next_time_, end_time_);
                    breakpoint_time_ = chrono::system_clock::now(); // chrono::floor<chrono::seconds>()
                    next_time_ += 1s;
                    if (next_time_ <= breakpoint_time_)
                        next_time_ = breakpoint_time_ + 1s; // next_time_ <= breakpoint_time_ mean trouble occures (in most cases ticker was suspended by user and/or by system)

                }
                else {
                    // end time
                    // 1. send udp packet (inform controller)
                    // 2. stop http-get requests to vmix
                    // 3. stop udp sends to controller
                    stopThreadFlag = true;
                    for (const auto& obj : udp_tcp_end_time_receivers.ticker_receivers)
                        obj->sendPacketMMSS(last_sent_mm, last_sent_ss, ticker_no);
                }
            }
        }
    }


    bool isThreadActive() const {
        return separate_thread_for_timer.joinable();
    }


    void per_second_updates(chrono::time_point<chrono::system_clock> next_time_, chrono::time_point<chrono::system_clock> start_time_) {
        //auto now = chrono::system_clock::now(); // chrono::floor<chrono::seconds>()
        //chrono::hh_mm_ss hms { now - floor<chrono::days>(now)};
        chrono::hh_mm_ss timenow{ next_time_ - start_time_ };
        uint8_t mm = timenow.hours().count()*60 + timenow.minutes().count();
        uint8_t ss = timenow.seconds().count();
        last_sent_mm = mm;
        last_sent_ss = ss;
        for (const auto& obj : udp_tcp_per_second_receivers.ticker_receivers)
            obj->sendPacketMMSS(mm, ss, ticker_no);
    }

    void per_second_updates_decrease(chrono::time_point<chrono::system_clock> next_time_, chrono::time_point<chrono::system_clock> start_time_) {
        //auto now = chrono::system_clock::now(); // chrono::floor<chrono::seconds>()
        //chrono::hh_mm_ss hms { now - floor<chrono::days>(now)};
        chrono::hh_mm_ss timenow{ next_time_ - start_time_ - 1s * 60 * end_mins_ - 1s * end_secs_ };
        uint8_t mm = timenow.hours().count() * 60 + timenow.minutes().count();
        uint8_t ss = timenow.seconds().count();
        last_sent_mm = mm;
        last_sent_ss = ss;
        for (const auto& obj : udp_tcp_per_second_receivers.ticker_receivers)
            obj->sendPacketMMSS(mm, ss, ticker_no);
    }

};
