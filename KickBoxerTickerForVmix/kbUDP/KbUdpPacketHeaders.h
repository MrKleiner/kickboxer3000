#pragma once

#include  <cstdint>
#include <map>

#define  kbBUFLEN    1472         // max length of answer


enum KbResponseCodesEnum : uint8_t {
    everything_good             = 0,
    everything_bad              = 1,
    wrong_message_format        = 2,
    wrong_number_of_args        = 3,
    wrong_timer_number          = 4,
    everything_good_and_payload = 200
};


const std::map <KbResponseCodesEnum, std::string> kb_response_codes_str = {
    { everything_good,             "Everithing good" },
    { everything_bad,              "Everything bad" },
    { wrong_message_format,        "Wrong message format" },
    { wrong_number_of_args,        "Wrong number of args for given command" },
    { wrong_timer_number,          "Wrong timer number" },
    { everything_good_and_payload, "everithing good and response has payload after return code" }
};


struct UDPmessageStruct {
    char message[kbBUFLEN];
    int  message_len;
};


/**
 {IFF1, IFF2, response_code} 
 By default response_code = 0 (everything_good)
 */
struct GeneralResponseUdpPacketHeader {
    uint8_t IFF1 = 37;
    uint8_t IFF2 = 37;
    KbResponseCodesEnum response_code = everything_good;
};



#define StartTimerRequestUdpPacketHeaderSignificantFieldsCount 6
struct StartTimerRequestUdpPacketHeader
{
    uint8_t IFF1 = 73;
    uint8_t IFF2 = 73;
    uint8_t command = 1;
    uint8_t timer_no = 0;
    uint8_t start_minutes = 0;
    uint8_t start_seconds = 0;
    uint8_t end_minutes = 0;
    uint8_t end_seconds = 0;
};



#define PauseTickerRequestUdpPacketHeaderSignificantFieldsCount 2
struct PauseTickerRequestUdpPacketHeader
{
    uint8_t IFF1 = 73;
    uint8_t IFF2 = 73;
    uint8_t command = 2;
    uint8_t timer_no = 0;
};



#define ResumeTickerRequestUdpPacketHeaderSignificantFieldsCount 2
struct ResumeTickerRequestUdpPacketHeader
{
    uint8_t IFF1 = 73;
    uint8_t IFF2 = 73;
    uint8_t command = 3;
    uint8_t timer_no = 0;
};


#define StopTickerRequestUdpPacketHeaderSignificantFieldsCount 2
struct StopTickerRequestUdpPacketHeader
{
    uint8_t IFF1 = 73;
    uint8_t IFF2 = 73;
    uint8_t command = 4;
    uint8_t timer_no = 0;
};


#define AddTimerHttpReceiverRequestUdpPacketHeaderSignificantFieldsCount 5
struct AddTimerHttpReceiverRequestUdpPacketHeader
{
    struct {
        uint8_t  IFF1 = 73;
        uint8_t  IFF2 = 73;
        uint8_t  command = 5;
        uint8_t  timer_no = 0;
        uint8_t  ipv4_addr[4] = { 0, 0, 0, 0 };
        uint16_t tcp_port = 0;
    } fixed_part;
    char     path[kbBUFLEN - 10];
};


#define GetTimerRequestUdpPacketHeaderSignificantFieldsCount 2
struct GetTimerRequestUdpPacketHeader
{
    uint8_t IFF1 = 73;
    uint8_t IFF2 = 73;
    uint8_t command = 6;
    uint8_t timer_no = 0;
};

struct GetTimerResponseUdpPacketHeader
{
    uint8_t IFF1 = 37;
    uint8_t IFF2 = 37;
    uint8_t response_code = 2;
    uint8_t timer_no = 0;
    uint8_t minutes = 0;
    uint8_t seconds = 0;
};


#define AddTimerUdpReceiverRequestUdpPacketHeaderSignificantFieldsCount 4
struct AddTimerUdpReceiverRequestUdpPacketHeader
{
    uint8_t  IFF1 = 73;
    uint8_t  IFF2 = 73;
    uint8_t  command = 7;
    uint8_t  timer_no = 0;
    uint8_t  ipv4_addr[4] = {0, 0, 0, 0};
    uint16_t udp_port = 0;
};


struct SendTimerUdpPacketHeader
{
    uint8_t IFF1 = 37;
    uint8_t IFF2 = 37;
    uint8_t response_code = 2;
    uint8_t timer_no = 0;
    uint8_t minutes = 0;
    uint8_t seconds = 0;
};
